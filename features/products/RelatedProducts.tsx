// ─── "You might also like" ──────────────────────────────────────────────────
// The one place the Next app talks to the Python service. This is a CROSS-
// ORIGIN browser fetch (Vercel → Render), which is why services/recommendations
// configures CORS with an ALLOWED_ORIGINS list — without our domain in it, the
// browser blocks the response.
//
// Design point worth absorbing: a second service means a second thing that can
// be down. Everything here is built so that failure is invisible — see the
// early `return null` below.
"use client";

import { useEffect, useState } from "react";
import { Product } from "./types";
import ProductCard from "./ProductCard";

export default function RelatedProducts({ productId }: { productId: number }) {
  // NEXT_PUBLIC_ is the prefix that lets an env var reach the browser. Next
  // inlines it into the bundle at BUILD time — so it is public by definition,
  // and a secret must never carry this prefix. It's also why lib/env.ts doesn't
  // require this one: the app must build and run without the Python service.
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
        // fetch does NOT reject on 404 or 500 — it only rejects on network
        // failure. Without this explicit check, an error page would sail into
        // .json() and fail confusingly. Easy mistake to make.
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
  //
  // This is the whole graceful-degradation strategy in three lines. The
  // recommendations section is an enhancement, not a requirement, so its
  // failure mode should be "the section isn't there", never an error message
  // or a broken product page. Note that returning null also covers the
  // legitimate empty case (a product that's alone in its category) — an empty
  // "You might also like" heading would look broken.
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
