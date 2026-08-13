// ─── Product grid + search ──────────────────────────────────────────────────
// THE catalog. There's no /products route — this client island is dropped into
// the server-rendered home page (app/page.tsx), which is the "server shell +
// client island" pattern: static markup rendered on the server, and only the
// genuinely interactive part shipped as JavaScript.
//
// It's a client component because search happens as you type, in the browser,
// after load. Search runs SERVER-SIDE though: each keystroke (debounced) queries
// Postgres via /api/products rather than filtering an array in memory. That's
// what lets the catalog grow past what you'd want to ship to a phone.
"use client";

import { useEffect, useState } from "react";
import { fetchProducts } from "@/lib/api";
import { useDebounce } from "@/lib/useDebounce";
import { Product } from "./types";
import ProductCard from "./ProductCard";

// A union type instead of separate isLoading/isError booleans — two booleans
// allow four combinations, half of which are nonsense.
type Status = "loading" | "error" | "success";

export default function ProductGrid() {
  const [products, setProducts] = useState<Product[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const [query, setQuery] = useState("");

  // Debounced so we hit the API after typing pauses, not on every keystroke.
  // `query` updates instantly (so the input stays responsive), while
  // `debouncedQuery` lags 300ms behind. Typing "laptop" fires ONE request
  // instead of six. See lib/useDebounce.ts.
  const debouncedQuery = useDebounce(query, 300);

  // Re-runs whenever the debounced search changes → fetches matching products
  // FROM THE SERVER. The filtering now happens in Postgres, not the browser.
  useEffect(() => {
    // ── Race-condition guard ────────────────────────────────────────────────
    // Responses can arrive out of order: search "a" then "ab", and if "a"'s
    // slower response lands second it would overwrite the correct results.
    // The cleanup function below runs before the next effect, flipping this
    // flag so a stale response is discarded instead of applied.
    let cancelled = false;

    // Note: we intentionally don't reset to "loading" here — keeping the
    // previous results visible while the new search loads avoids a flash on
    // every keystroke (and calling setState synchronously in an effect is a
    // React anti-pattern the linter flags).
    fetchProducts(debouncedQuery)
      .then((data) => {
        if (cancelled) return;
        setProducts(data);
        setStatus("success");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    // React runs this cleanup before the next effect and on unmount — which is
    // also what prevents "setState on an unmounted component" warnings.
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]); // dependency array: re-run ONLY when the search changes

  return (
    <div>
      <div className="mb-6">
        {/* sr-only hides this visually but keeps it for screen readers. A
            placeholder is NOT a label — it disappears once you start typing,
            and many assistive tools ignore it. */}
        <label htmlFor="product-search" className="sr-only">
          Search products
        </label>
        <input
          id="product-search"
          type="search" // gives browsers a native clear (×) button
          // A CONTROLLED input: React state is the source of truth, and every
          // keystroke re-renders. Contrast with the login form, which is
          // uncontrolled — here we need the live value to drive the search.
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search products…"
          className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
        />
      </div>

      {/* Four distinct UI states, handled explicitly: error, loading, empty,
          and results. The empty state is the one people forget — without it a
          no-match search renders a blank area that reads as a broken page. */}
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
        // Mobile-first responsive grid: 2 columns by default, 3 from the `sm`
        // breakpoint, 4 from `lg`. Tailwind prefixes are min-width based.
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            // A stable database id as `key` — never the array index, which
            // would make React reuse the wrong card when results reorder.
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
