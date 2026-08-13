# features/products/ — Catalog UI

| File | Role |
|---|---|
| `types.ts` | `Product = { id, title, description, price, thumbnail, category, rating }` — the API DTO shape, a deliberate subset of the Prisma model (no `stock`, no `createdAt`). Also imported by `lib/api.ts`. |
| `ProductGrid.tsx` | `"use client"` search + list island. Rendered by `app/page.tsx`. |
| `ProductCard.tsx` | `"use client"` card, `export default memo(ProductCard)`. |
| `RelatedProducts.tsx` | `"use client"`, calls the FastAPI recommendations service. |

## Notes

- **`ProductGrid` is the catalog.** There is no `/products` route; the grid is the client island inside the `/` server shell. It calls `fetchProducts` (`@/lib/api`, hardcoded `limit=24`) debounced 300 ms via `useDebounce` (`@/lib/useDebounce`), tracks a `"loading"｜"error"｜"success"` union, and uses a `cancelled` flag in the effect cleanup to drop stale responses.
- **`ProductCard` link structure matters**: the `<Link>` wraps only the image and text — the add-to-cart button sits *outside* it, so clicking add-to-cart doesn't navigate. Keep that nesting.
- **`RelatedProducts` degrades silently.** Fetches `${NEXT_PUBLIC_RECOMMENDATIONS_API_URL}/recommendations/${productId}?limit=4`; initial status is derived from whether the env var exists; renders `null` on error or empty. It's the only consumer of that env var, and `lib/env.ts` deliberately does not require it — the app must build and run without the Python service.
