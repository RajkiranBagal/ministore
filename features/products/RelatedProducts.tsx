// ─── "You might also like" ──────────────────────────────────────────────────
// MIGRATED TO GRAPHQL, and this is the migration that actually pays for itself.
//
// Before: the browser called the Python service DIRECTLY, cross-origin
// (Vercel → Render). That required three things we no longer need:
//
//   1. CORS on the Python side — the browser was a foreign origin, so
//      services/recommendations had to maintain an ALLOWED_ORIGINS list.
//   2. NEXT_PUBLIC_RECOMMENDATIONS_API_URL — the service URL was inlined into
//      the client bundle at build time, i.e. published to anyone who looked.
//   3. A second public endpoint to think about.
//
// After: the browser calls our own same-origin /api/graphql, and the `related`
// resolver calls the Python service server-to-server. The URL moved to a
// server-only env var (RECOMMENDATIONS_API_URL, no NEXT_PUBLIC_ prefix) and is
// no longer in the bundle at all.
//
// The graceful-degradation posture is unchanged: if the recommendations service
// is unreachable, the resolver returns [] and this renders null.
"use client";

import { useEffect, useState } from "react";
import { Product } from "./types";
import { gqlRequest } from "@/lib/graphql/client";
import ProductCard from "./ProductCard";

// One query spanning two backends: `related` is ranked by the Python service,
// and the product fields come from Postgres. The client neither knows nor cares
// that two systems were involved — which is the actual selling point of a
// graph, as opposed to shape flexibility.
const RELATED_QUERY = /* GraphQL */ `
  query Related($id: Int!) {
    product(id: $id) {
      related {
        id
        title
        description
        price
        thumbnail
        category
        rating
      }
    }
  }
`;

type RelatedResult = { product: { related: Product[] } | null };

export default function RelatedProducts({ productId }: { productId: number }) {
  const [recs, setRecs] = useState<Product[]>([]);
  // No env check needed in the initial state any more — the endpoint is our own
  // origin and always exists. Whether the upstream Python service is configured
  // is now a server-side concern, invisible from here.
  const [status, setStatus] = useState<"loading" | "error" | "done">("loading");

  useEffect(() => {
    let cancelled = false;

    gqlRequest<RelatedResult>(RELATED_QUERY, { id: productId })
      .then((data) => {
        if (cancelled) return;
        setRecs(data.product?.related ?? []);
        setStatus("done");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [productId]);

  // Graceful fallback: if the FastAPI service is down or returns nothing,
  // render nothing — a separate service failing must NOT break the page.
  //
  // Note this now catches the failure at two levels: the resolver already
  // swallows an upstream outage and returns [], and this catches any failure of
  // our own endpoint. Either way the section simply isn't there. It also covers
  // the legitimate empty case (a product alone in its category) — an empty
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
