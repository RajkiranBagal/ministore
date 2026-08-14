# features/products/ — Catalog UI

| File | Role |
|---|---|
| `types.ts` | `Product = { id, title, description, price, thumbnail, category, rating }` — the API DTO shape, a deliberate subset of the Prisma model (no `stock`, no `createdAt`). Also imported by `lib/api.ts`. |
| `ProductGrid.tsx` | `"use client"` search + list island. Rendered by `app/page.tsx`. |
| `ProductCard.tsx` | `"use client"` card, `export default memo(ProductCard)`. |
| `RelatedProducts.tsx` | `"use client"`, queries `/api/graphql` for `product(id) { related }`. |

## Notes

- **`ProductGrid` is the catalog.** There is no `/products` route; the grid is the client island inside the `/` server shell. It calls `fetchProducts` (`@/lib/api`, hardcoded `limit=24`) debounced 300 ms via `useDebounce` (`@/lib/useDebounce`), tracks a `"loading"｜"error"｜"success"` union, and uses a `cancelled` flag in the effect cleanup to drop stale responses.
- **`ProductCard` link structure matters**: the `<Link>` wraps only the image and text — the add-to-cart button sits *outside* it, so clicking add-to-cart doesn't navigate. Keep that nesting.
- **Both `ProductGrid` and `RelatedProducts` go through GraphQL** (`gqlRequest` from `@/lib/graphql/client`), not REST. `fetchProducts` kept its old signature during the migration, so `ProductGrid` itself needed no edits.
- **`RelatedProducts` degrades silently.** Queries `product(id) { related { … } }` against same-origin `/api/graphql`; renders `null` on error *or* on an empty list (an empty "You might also like" heading looks broken). The failure is now caught at two levels — the resolver swallows an upstream outage and returns `[]`, and this catches a failure of our own endpoint. The service URL is server-only (`RECOMMENDATIONS_API_URL`) and no longer in the client bundle.
