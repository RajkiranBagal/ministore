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
# Our Next.js app (localhost:3000) is a DIFFERENT origin from this service
# (localhost:8000), so the browser needs these headers to allow the fetch.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
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