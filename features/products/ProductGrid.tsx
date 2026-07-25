"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchProducts } from "@/lib/api";
import { useDebounce } from "@/lib/useDebounce";
import { Product } from "./types";
import ProductCard from "./ProductCard";

type Status = "loading" | "error" | "success";

export default function ProductGrid() {
  const [products, setProducts] = useState<Product[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const [query, setQuery] = useState("");

  // Filtering runs 300ms after the last keystroke, not on every one.
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    let cancelled = false;
    fetchProducts()
      .then((data) => {
        if (cancelled) return;
        setProducts(data);
        setStatus("success");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // useMemo recomputes the filtered list ONLY when `products` or the DEBOUNCED
  // query change. Note `query` is not a dependency — so typing fast doesn't
  // re-filter 100 items on every keystroke, only after the pause.
  const filtered = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    );
  }, [products, debouncedQuery]);

  if (status === "loading") {
    return <p className="p-8 text-center text-gray-500">Loading products…</p>;
  }

  if (status === "error") {
    return (
      <p className="p-8 text-center text-red-600" role="alert">
        Something went wrong loading products. Please try again.
      </p>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <label htmlFor="product-search" className="sr-only">
          Search products
        </label>
        <input
          id="product-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search products…"
          className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="p-8 text-center text-gray-500">
          No products match “{debouncedQuery}”.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
