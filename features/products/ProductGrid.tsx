"use client";

import { useEffect, useState } from "react";
import { fetchProducts } from "@/lib/api";
import { useDebounce } from "@/lib/useDebounce";
import { Product } from "./types";
import ProductCard from "./ProductCard";

type Status = "loading" | "error" | "success";

export default function ProductGrid() {
  const [products, setProducts] = useState<Product[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const [query, setQuery] = useState("");

  // Debounced so we hit the API after typing pauses, not on every keystroke.
  const debouncedQuery = useDebounce(query, 300);

  // Re-runs whenever the debounced search changes → fetches matching products
  // FROM THE SERVER. The filtering now happens in Postgres, not the browser.
  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    fetchProducts(debouncedQuery)
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
  }, [debouncedQuery]);

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

      {status === "error" ? (
        <p className="p-8 text-center text-red-600" role="alert">
          Something went wrong loading products. Please try again.
        </p>
      ) : status === "loading" ? (
        <p className="p-8 text-center text-gray-500">Loading products…</p>
      ) : products.length === 0 ? (
        <p className="p-8 text-center text-gray-500">
          No products match “{debouncedQuery}”.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
