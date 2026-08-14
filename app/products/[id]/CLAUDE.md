# app/products/[id]/ — Product detail

One file, `page.tsx`, Server Component. Two exports: `generateMetadata({params})` and default `ProductDetailPage({params})`.

## Patterns worth copying

- **Next 16 async params**: `params: Promise<{ id: string }>` — `await params` in both exports.
- **Direct DB read, not a fetch to our own API.** Uses `getProduct(Number(id))` from `@/lib/products`. Server Components should query the DB directly; `/api/products` exists for the browser.
- **Double-caching in `lib/products.ts`**: `unstable_cache(fn, ["product-by-id"], { tags: ["products"], revalidate: 3600 })` wrapped in React `cache()`. The React `cache()` layer is what makes `generateMetadata` and the page body share one DB round-trip; `unstable_cache` is what survives across requests. Invalidated by `revalidateTag("products", "max")` in `app/api/orders/route.ts`.
- `getProduct` guards `Number.isInteger(id)`, so `/products/abc` → `null` → `notFound()` (404) rather than a Prisma error.
- **SEO**: `generateMetadata` builds title/description from the product, falling back to `"Product not found — MiniStore"`.

## Client islands rendered here

- `AddToCartButton` (`@/features/cart`) — dispatches the Redux `addItem`.
- `RelatedProducts` (`@/features/products`) — same-origin `product(id) { related { … } }` query to `/api/graphql`; the resolver calls the FastAPI service server-side. Renders `null` on any failure, so the page degrades gracefully when that service is down.
