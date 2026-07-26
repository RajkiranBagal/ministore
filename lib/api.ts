import { Product } from "@/features/products/types";

// The API wraps the array: { products, total, skip, limit }.
// We type that envelope, then return just the array to callers.
type ProductsResponse = {
  products: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

// Now hits OUR API (a relative URL — same origin), and passes the search
// query to the server so filtering happens in the database.
export async function fetchProducts(query = ""): Promise<Product[]> {
  const params = new URLSearchParams({ limit: "24" });
  if (query.trim()) params.set("q", query.trim());

  const res = await fetch(`/api/products?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch products: ${res.status}`);
  }
  const data: ProductsResponse = await res.json();
  return data.products;
}
