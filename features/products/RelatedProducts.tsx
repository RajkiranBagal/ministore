"use client";

import { useEffect, useState } from "react";
import { Product } from "./types";
import ProductCard from "./ProductCard";

export default function RelatedProducts({ productId }: { productId: number }) {
  const apiBase = process.env.NEXT_PUBLIC_RECOMMENDATIONS_API_URL;
  const [recs, setRecs] = useState<Product[]>([]);
  // Derive the initial status instead of setting it in the effect (which the
  // lint rule flags): if the API URL is missing, we're already in "error".
  const [status, setStatus] = useState<"loading" | "error" | "done">(
    apiBase ? "loading" : "error"
  );

  useEffect(() => {
    if (!apiBase) return; // env missing -> status is already "error"
    let cancelled = false;
    fetch(`${apiBase}/recommendations/${productId}?limit=4`)
      .then((res) => {
        if (!res.ok) throw new Error(String(res.status));
        return res.json();
      })
      .then((data: Product[]) => {
        if (!cancelled) {
          setRecs(data);
          setStatus("done");
        }
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [productId, apiBase]);

  // Graceful fallback: if the FastAPI service is down or returns nothing,
  // render nothing — a separate service failing must NOT break the page.
  if (status === "error" || (status === "done" && recs.length === 0)) {
    return null;
  }

  return (
    <section className="mt-12">
      <h2 className="mb-4 text-lg font-semibold text-gray-900">
        You might also like
      </h2>
      {status === "loading" ? (
        <p className="text-sm text-gray-500">Loading recommendations…</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {recs.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </section>
  );
}
