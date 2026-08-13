# lib/ — Server utilities & data access

Flat module folder. Every file is a small single-purpose module with named exports.

| Module | Exports | Purpose |
|---|---|---|
| `db.ts` | `prisma` | Prisma 7 client singleton via the **`PrismaPg` driver adapter**; cached on `globalThis` outside production so HMR doesn't leak connections. |
| `env.ts` | `env` | Zod-validated `process.env` **at import time**. Only `DATABASE_URL` is required; throws with flattened field errors. |
| `validation.ts` | `productQuerySchema`, `ProductQuery`, `signupSchema`, `checkoutSchema` | All request-input zod schemas live here — one place, not per-route. |
| `rate-limit.ts` | `rateLimit(key, limit, windowMs)`, `clientIp(request)`, `RateLimitResult` | In-memory fixed-window limiter over a module-level `Map`. |
| `api-response.ts` | `errorResponse(message, status, details?)` | The `{ error, details? }` JSON envelope. |
| `logger.ts` | `logger` (`.info/.warn/.error`) | One JSON object per line: `level`, `event`, ISO `time`, spread context. |
| `products.ts` | `getProduct(id)` | Cached single-product read. |
| `orders.ts` | `getUserOrders(userId)` | User-scoped order history. |
| `api.ts` | `fetchProducts(query = "")` | **Browser-side.** Signature unchanged, but now POSTs a `products` query to `/api/graphql` rather than hitting `/api/products`. |
| `useDebounce.ts` | `useDebounce<T>(value, delay = 300)` | Client hook for the search box. |
| `graphql/` | `schema`, `builder`, `createContext`, `gqlRequest` | GraphQL layer — see `graphql/CLAUDE.md`. |

## Things to know before editing

- **`lib/generated/prisma/` is generated and gitignored.** It's the Prisma 7 custom `output` dir, rebuilt by `prisma generate` on every `postinstall`. Import types from `@/lib/generated/prisma/client` — **not** from `@prisma/client`. Never hand-edit it, never document it.
- **Server vs client split isn't enforced by folder.** `api.ts`, `useDebounce.ts` and `graphql/client.ts` are browser modules; everything else (including the rest of `graphql/`) is server-only. Importing `db.ts`/`env.ts` into a `"use client"` component will break the build.
- **`getProduct` is double-cached**: `unstable_cache(..., ["product-by-id"], { tags: ["products"], revalidate: 3600 })` inside React `cache()`. The outer `cache()` dedupes within one request (so `generateMetadata` + page body share a query); the inner one persists across requests. Bust it with `revalidateTag("products", "max")`. It also rejects non-integer ids so bad URLs 404 cleanly.
- **`getUserOrders` enforces authorization in the query** (`where: { userId }`) with a nested `include` to avoid N+1. Don't fetch-then-filter.
- **`rate-limit.ts` is single-instance only** — a module-level `Map` resets per serverless instance and isn't shared across them. It's documented as a known gap (Redis/Upstash is the noted fix). Don't treat it as a real limiter.
- Money is stored and passed as integer cents; `getProduct` and the API routes convert to dollars at the boundary.

## Tests

`rate-limit.test.ts` (uses `jest.useFakeTimers()`) and `validation.test.ts`. Jest, colocated, run by `npm test`.
