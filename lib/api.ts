import { Product } from "@/features/products/types";

// The API wraps the array: { products, total, skip, limit }.
// We type that envelope, then return just the array to callers.
type ProductsResponse = {
  products: Product[];
  total: number;
};

export async function fetchProducts(): Promise<Product[]> {
  const res = await fetch("https://dummyjson.com/products?limit=100");

  // fetch() does NOT throw on 404/500 — you must check res.ok yourself.
  // This is a classic interview gotcha. Handle it explicitly.
  if (!res.ok) {
    throw new Error(`Failed to fetch products: ${res.status}`);
  }

  const data: ProductsResponse = await res.json();
  return data.products;
}
