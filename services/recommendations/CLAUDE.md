# services/recommendations/ — FastAPI recommendations

Python 3.12 microservice. Reads the **same Neon Postgres** as the Next app, directly via `psycopg` v3 — no Prisma, no ORM, and it does not call the Next API.

Files: `main.py`, `requirements.txt`, plus a local `.env` (just `DATABASE_URL`) and gitignored `.venv/` / `__pycache__/`.

## Endpoints

| Route | Response |
|---|---|
| `GET /health` | `{"status": "ok"}` |
| `GET /recommendations/{product_id}?limit=4` | `list[Recommendation]` — Pydantic model `{id, title, description, price: float, thumbnail, category, rating}` |

Recommendation logic: look up the product's category (404 `"Product not found"` if missing), then
`SELECT … FROM "Product" WHERE category = %s AND id != %s ORDER BY rating DESC LIMIT %s` — parameterized, and served by the `Product_category_rating_idx` composite index. `priceCents / 100` → `price` at the boundary, mirroring the Next API's dollars convention.

Note the quoted `"Product"` table name — Prisma creates PascalCase tables, so unquoted identifiers won't resolve in raw SQL.

## Config

- `load_dotenv()` at import; `os.environ["DATABASE_URL"]` (hard fails if absent).
- CORS via `CORSMiddleware`, origins from comma-separated `ALLOWED_ORIGINS` (default `http://localhost:3000`), `allow_methods=["GET"]`.

## Deps & deploy

`fastapi==0.140.0`, `uvicorn[standard]==0.51.0`, `psycopg[binary]==3.3.4`, `python-dotenv==1.2.2` — all pinned exactly.

`render.yaml` (repo root) is a Render blueprint: `rootDir: services/recommendations`, build `pip install -r requirements.txt`, start `uvicorn main:app --host 0.0.0.0 --port $PORT`, `PYTHON_VERSION=3.12.13`, `DATABASE_URL` as a dashboard secret (`sync: false`), `ALLOWED_ORIGINS` listing the Vercel domain + localhost.

## Local

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

The Next app now reaches it **server-to-server**, from the `Product.related` GraphQL resolver (`lib/graphql/schema.ts`), using `RECOMMENDATIONS_API_URL` — server-only, no `NEXT_PUBLIC_` prefix, and still not required by `lib/env.ts` (the resolver returns `[]` without it).

It used to be a cross-origin call straight from the browser, which is why `ALLOWED_ORIGINS`/CORS exists in `render.yaml`. That requirement is gone now — the only caller is the Next server — but the config is left in place rather than removed as a drive-by.
