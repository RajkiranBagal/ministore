// ─── Cached product reads ───────────────────────────────────────────────────
// SERVER-ONLY. Used by the product detail page, which reads Postgres directly
// rather than fetching our own /api/products.
//
// This file demonstrates the two DIFFERENT caching layers Next gives you, which
// are easy to confuse:
//
//   React cache()     → deduplicates calls WITHIN one request. Lives for the
//                       lifetime of a single render. Solves "two components
//                       both need this product".
//   unstable_cache()  → persists ACROSS requests until revalidated. Solves
//                       "10,000 visitors want the same product page".
//
// They compose: the outer cache() means one request touches the inner cache
// once, and the inner one means most requests never touch Postgres at all.

import { cache } from "react";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";

// unstable_cache stores the result in Next's DATA CACHE — shared ACROSS
// requests (until revalidated), so repeated product views don't re-hit the DB.
// The "products" tag lets us invalidate it on mutation; `revalidate` is the max
// age (seconds) before a background refresh.
const getCachedProduct = unstable_cache(
  async (id: number) => {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) return null;

    // DB-model → API-shape mapping (priceCents → dollars).
    // Mapping explicitly (rather than returning `product`) also keeps `stock`
    // out of the cached value — worth avoiding, since stock changes constantly
    // and this entry can live for an hour.
    return {
      id: product.id,
      title: product.title,
      description: product.description,
      price: product.priceCents / 100,
      thumbnail: product.thumbnail,
      category: product.category,
      rating: product.rating,
    };
  },
  ["product-by-id"], // key prefix; the `id` argument is added to the key too
  { tags: ["products"], revalidate: 3600 } // 1h; invalidate via tag "products"
);
// ↑ Two independent invalidation triggers: `revalidate: 3600` is the time-based
// fallback, and the "products" tag is the event-based one — checkout calls
// revalidateTag("products") after decrementing stock, so a purchase doesn't
// leave a stale page up for an hour. Time-based alone would be too slow;
// tag-based alone would miss changes made outside the app (e.g. the seed script).

// React's cache() dedups WITHIN a single request (the detail page calls this
// twice: generateMetadata + the page body). Two complementary layers:
// cache() = per-request dedup, unstable_cache = cross-request data cache.
export const getProduct = cache(async (id: number) => {
  // Guard BEFORE the cache lookup. `Number("abc")` is NaN, and passing NaN into
  // a Prisma `where: { id }` throws — so /products/abc would 500 instead of 404.
  // Returning null lets the page call notFound() and render a proper 404.
  if (!Number.isInteger(id)) return null;
  return getCachedProduct(id);
});
