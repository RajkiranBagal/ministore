# app/api/products/ — GET /api/products

Public product search/list. No auth, no rate limit. Single file: `route.ts`, `export async function GET(request: NextRequest)`.

## Contract

Query params, validated by `productQuerySchema` (`@/lib/validation`):

| Param | Rule | Default |
|---|---|---|
| `q` | optional string, matches title | — |
| `category` | optional string | — |
| `sort` | `price_asc` \| `price_desc` \| `rating` \| `newest` | `newest` |
| `page` | coerced int ≥ 1 | 1 |
| `limit` | coerced int 1–50 | 12 |

**200**
```json
{ "products": [{ "id", "title", "description", "price", "thumbnail", "category", "rating" }],
  "pagination": { "page", "limit", "total", "totalPages" } }
```
`price` is **dollars** (converted from `priceCents`). `stock` and `createdAt` are intentionally omitted.

**400** — `{ error: "Invalid query parameters", details }`.

## Implementation notes

- Builds `Prisma.ProductWhereInput` with conditional spreads and an `orderByMap` keyed by `sort`; `count` + `findMany` run in one `Promise.all`; offset pagination via `skip: (page-1)*limit`.
- Imports the `Prisma` namespace type from `@/lib/generated/prisma/client` — Prisma 7 custom output dir, **not** `@prisma/client`.
- Uncached per-request. The cached read path is `getProduct()` in `lib/products.ts`, used by the detail page.
- Sole consumer: `fetchProducts()` in `lib/api.ts`, which hardcodes `limit=24`.
