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

// React's cache() dedups WITHIN a single request (the detail page calls this
// twice: generateMetadata + the page body). Two complementary layers:
// cache() = per-request dedup, unstable_cache = cross-request data cache.
export const getProduct = cache(async (id: number) => {
  if (!Number.isInteger(id)) return null; // guards against /products/abc
  return getCachedProduct(id);
});
