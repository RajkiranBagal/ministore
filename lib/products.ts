import { cache } from "react";
import { prisma } from "@/lib/db";

// React's cache() memoizes this PER REQUEST. The detail page calls it twice
// (once in generateMetadata, once in the page body) — cache() makes that a
// SINGLE database query instead of two. A free production optimization.
export const getProduct = cache(async (id: number) => {
  if (!Number.isInteger(id)) return null; // guards against /products/abc

  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) return null;

  // Same DB-model → API-shape mapping (priceCents → dollars).
  return {
    id: product.id,
    title: product.title,
    description: product.description,
    price: product.priceCents / 100,
    thumbnail: product.thumbnail,
    category: product.category,
    rating: product.rating,
  };
});
