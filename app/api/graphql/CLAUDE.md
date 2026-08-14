# app/api/graphql/ — GET/POST /api/graphql

GraphQL Yoga mounted as a route handler. Single file: `route.ts`. The schema itself lives in `lib/graphql/` — see `lib/graphql/CLAUDE.md`.

**Additive, not a replacement.** `/api/products` still exists and still works. This endpoint was added as a deliberate, measured experiment; nothing was deleted.

## Scope

**Read-only — there are no mutations.** Checkout and signup stay on REST because their per-route rate limits (`checkout` 10/min, `signup` 5/min) don't survive being collapsed onto a single POST endpoint.

| Query | Returns |
|---|---|
| `products(q, category, sort, page, limit)` | `ProductPage { products, pagination }` |
| `product(id)` | `Product` or `null` |

## Yoga config that matters

- `graphqlEndpoint: "/api/graphql"` — must match the route path or Yoga's internal routing 404s.
- `fetchAPI: { Response }` — Yoga needs the runtime's `Response` to build replies inside Next.
- `graphiql` and `maskedErrors` are keyed off `NODE_ENV`: the explorer and introspection are **off in production** (they're free reconnaissance), errors are masked there.
- `plugins: [maxDepthPlugin({ n: 4 })]` — **not optional.** `Product.related` returns Products, which have their own `related`, so the schema is recursive. Before this plugin, a 4-level nested query took **15.5 s** and returned 200 (~256 chained calls to the Python service). Both queries the app actually issues measure as depth 3, so `n: 4` leaves one level of headroom. Note the counting convention: `{ product { title } }` is depth **2**, not 1.

## Rate limiting

Applied at the transport level in the wrapper `handler`, before `handleRequest`: `rateLimit("graphql:" + clientIp(request), 60, 60_000)`.

This is the honest weak point of one-endpoint-for-everything — every query is the same POST, so the limiter can cap request *volume* but can't tell a cheap product lookup from an expensive nested one. That asymmetry is why the mutations stayed on REST.

Same in-memory `Map` as everywhere else, so the same known gap applies: single-instance only.
