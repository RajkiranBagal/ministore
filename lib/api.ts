// ─── Browser-side API client ────────────────────────────────────────────────
// ⚠️  CLIENT-ONLY. This is one of only two files in lib/ meant for the browser
// (the other is useDebounce.ts) — everything else here is server-only.
//
// The give-away is the relative URL below: "/api/products" resolves against the
// current page's origin, which only exists in a browser. Server Components skip
// this module entirely and query Postgres directly (see lib/products.ts).

import { Product } from "@/features/products/types";

// The API wraps the array: { products, total, skip, limit }.
// We type that envelope, then return just the array to callers.
//
// Typing the response is what turns a runtime surprise into a compile error:
// `res.json()` returns `any`, so without this annotation TypeScript would
// happily accept `data.produtcs` and hand you undefined at runtime.
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
  // URLSearchParams handles the encoding, so a search for "a&b" or "50% off"
  // can't break the URL. Never build query strings by concatenation.
  const params = new URLSearchParams({ limit: "24" });
  // Only send `q` when there's something to search for — an empty q= would
  // filter on the empty string rather than returning everything.
  if (query.trim()) params.set("q", query.trim());

  const res = await fetch(`/api/products?${params.toString()}`);
  // fetch only rejects on network failure, NOT on 4xx/5xx — so an error status
  // must be checked explicitly or a 500's HTML body ends up in .json().
  if (!res.ok) {
    throw new Error(`Failed to fetch products: ${res.status}`);
  }
  const data: ProductsResponse = await res.json();
  // Unwrap the envelope. Callers want products; the pagination metadata isn't
  // used yet (the grid shows a single page of 24) — surface it here when it is.
  return data.products;
}
