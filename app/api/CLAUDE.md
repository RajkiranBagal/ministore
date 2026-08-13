# app/api/ — Route handlers

Four handlers. All return JSON.

| Route | Method | Auth | Rate limit | Detail |
|---|---|---|---|---|
| `/api/products` | GET | public | none | `products/CLAUDE.md` |
| `/api/orders` | POST | required (401) | `checkout:<ip>` 10/60s | `orders/CLAUDE.md` |
| `/api/auth/register` | POST | public | `signup:<ip>` 5/60s | `auth/CLAUDE.md` |
| `/api/auth/[...nextauth]` | GET/POST | — | `login:<ip>` 10/60s (in `authorize()`) | `auth/CLAUDE.md` |

## Handler conventions

Order of operations in a mutating handler: **auth → rate limit → validate → work**. (`orders` follows this exactly; `register` is public so it rate-limits first.)

- **Validation**: zod schema from `@/lib/validation`, always `safeParse`, and on failure return `{ error, details: parsed.error.flatten() }` with 400.
- **Errors**: `errorResponse(message, status, details?)` from `@/lib/api-response` produces the standard `{error, details?}` shape. `orders/route.ts` uses it; `auth/register/route.ts` still hand-rolls `NextResponse.json` — an inconsistency, prefer the helper in new code.
- **Rate limiting**: `rateLimit(key, max, windowMs)` from `@/lib/rate-limit`, key is `"<action>:" + clientIp(request)`. In-memory `Map`, so it only works per-instance — do not treat it as a real limiter under serverless.
- **Logging**: `logger.info/error("<domain>.<event>", {...})` from `@/lib/logger`.
- **Never return `passwordHash`**, and don't leak internal fields — `/api/products` deliberately drops `stock` and `createdAt` from its response.
- After mutating product stock, call `revalidateTag("products", "max")` to bust the `unstable_cache` in `lib/products.ts`.
