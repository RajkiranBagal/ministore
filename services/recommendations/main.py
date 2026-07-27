import os

import psycopg
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

load_dotenv()
DATABASE_URL = os.environ["DATABASE_URL"]

app = FastAPI(title="MiniStore Recommendations")

# CORS: browsers block cross-origin requests by default (same-origin policy).
# Allowed origins come from an env var so we permit localhost in dev and the
# deployed Vercel domain in production (comma-separated).
allowed_origins = os.environ.get("ALLOWED_ORIGINS", "http://localhost:3000").split(
    ","
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in allowed_origins],
    allow_methods=["GET"],
    allow_headers=["*"],
)


class Recommendation(BaseModel):
    id: int
    title: str
    description: str
    price: float
    thumbnail: str
    category: str
    rating: float


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/recommendations/{product_id}", response_model=list[Recommendation])
def get_recommendations(product_id: int, limit: int = 4):
    with psycopg.connect(DATABASE_URL) as conn:
        with conn.cursor() as cur:
            cur.execute('SELECT category FROM "Product" WHERE id = %s', (product_id,))
            row = cur.fetchone()
            if row is None:
                raise HTTPException(status_code=404, detail="Product not found")
            category = row[0]

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