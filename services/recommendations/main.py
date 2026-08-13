"""MiniStore recommendations service.

A small FastAPI app that answers "what else might this shopper like?". It's a
separate Python service, deployed independently on Render, that reads the SAME
Neon Postgres database as the Next.js app.

Why a second service at all? Honestly: to make the project polyglot and to
practise the integration. In a real system the justification would be that
recommendation work belongs in Python's data/ML ecosystem. Note the real cost —
two deploy pipelines, two runtimes, and a new failure mode — which is why the
frontend is written to degrade gracefully when this is down (see
features/products/RelatedProducts.tsx).

The recommendation logic is deliberately naive: highest-rated other products in
the same category. No ML, no user history.

Run locally:
    uvicorn main:app --reload --port 8000
Interactive docs (generated automatically from the type hints):
    http://localhost:8000/docs
"""

import os

import psycopg
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

load_dotenv()
# os.environ[...] rather than .get() — this raises KeyError at import time if
# the variable is missing, so a misconfigured deploy fails immediately and
# loudly instead of erroring on the first request. Same "fail fast" idea as
# lib/env.ts on the Node side.
DATABASE_URL = os.environ["DATABASE_URL"]

app = FastAPI(title="MiniStore Recommendations")

# CORS: browsers block cross-origin requests by default (same-origin policy).
# Allowed origins come from an env var so we permit localhost in dev and the
# deployed Vercel domain in production (comma-separated).
#
# This matters here because the browser calls this API directly from the Vercel
# domain — a different origin — so without our domain in this list the browser
# discards the response. The production value is set in render.yaml.
# Never use allow_origins=["*"] for an API that handles credentials.
allowed_origins = os.environ.get("ALLOWED_ORIGINS", "http://localhost:3000").split(
    ","
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in allowed_origins],  # strip stray spaces
    allow_methods=["GET"],  # this service is read-only; don't advertise more
    allow_headers=["*"],
)


class Recommendation(BaseModel):
    """Response shape for one recommended product.

    Pydantic does three jobs from this one declaration: validates outgoing data,
    serialises it to JSON, and generates the OpenAPI schema behind /docs. It's
    the Python counterpart to the TypeScript `Product` type — and note the
    fields match features/products/types.ts exactly, so the same ProductCard
    component renders results from either service.
    """

    id: int
    title: str
    description: str
    price: float  # dollars, converted from the integer cents column
    thumbnail: str
    category: str
    rating: float


@app.get("/health")
def health():
    """Liveness probe. Render (and any uptime monitor) pings this to check the
    service is up without touching the database."""
    return {"status": "ok"}


@app.get("/recommendations/{product_id}", response_model=list[Recommendation])
def get_recommendations(product_id: int, limit: int = 4):
    """Return the top-rated other products in the same category.

    FastAPI derives everything from this signature: `product_id: int` comes from
    the path and is coerced and validated (a non-numeric id returns 422
    automatically), while `limit: int = 4` becomes an optional query parameter.
    No manual parsing, and it all lands in the generated OpenAPI docs.
    """
    # A fresh connection per request — simple, and fine at this scale. A busier
    # service would use a connection pool (psycopg_pool) instead, since the TCP
    # and TLS handshake dominates the cost of a query this small.
    # Both `with` blocks close their resource even if an exception is raised.
    with psycopg.connect(DATABASE_URL) as conn:
        with conn.cursor() as cur:
            # Note the double quotes around "Product": Prisma creates tables
            # with PascalCase names, and Postgres folds unquoted identifiers to
            # lowercase — so an unquoted Product would fail as "product".
            #
            # The %s placeholder is NOT string formatting. psycopg sends the
            # value separately from the SQL, so the database can never parse it
            # as code. Building this string with an f-string or + would be a
            # textbook SQL injection hole.
            cur.execute('SELECT category FROM "Product" WHERE id = %s', (product_id,))
            row = cur.fetchone()
            if row is None:
                # HTTPException is FastAPI's way to return an error response;
                # raising it produces {"detail": "Product not found"} with a 404.
                raise HTTPException(status_code=404, detail="Product not found")
            category = row[0]

            # This query is exactly what the composite @@index([category, rating])
            # in schema.prisma was added for: filter on category, order by
            # rating. Postgres can walk the index instead of sorting the table.
            #
            # `id != %s` excludes the product you're already looking at.
            cur.execute(
                '''
                SELECT id, title, description, "priceCents", thumbnail, category, rating
                FROM "Product"
                WHERE category = %s AND id != %s
                ORDER BY rating DESC
                LIMIT %s
                ''',
                (category, product_id, limit),
            )
            rows = cur.fetchall()

    # psycopg returns plain tuples, so the columns are positional — r[0] is id
    # because it's listed first in the SELECT. Reordering the SELECT without
    # reordering these breaks it silently, which is why a real codebase would
    # use psycopg's dict_row factory.
    #
    # `price=r[3] / 100` is the cents → dollars conversion, matching what the
    # Next.js API does. Same rule everywhere: integers in the database, dollars
    # only at the boundary.
    return [
        Recommendation(
            id=r[0],
            title=r[1],
            description=r[2],
            price=r[3] / 100,
            thumbnail=r[4],
            category=r[5],
            rating=r[6],
        )
        for r in rows
    ]
