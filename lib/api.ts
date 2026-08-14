// ─── Browser-side data fetching ─────────────────────────────────────────────
// ⚠️  CLIENT-ONLY. This is one of only two files in lib/ meant for the browser
// (the other is useDebounce.ts) — everything else here is server-only.
//
// MIGRATED TO GRAPHQL. This used to call `GET /api/products?limit=24&q=…`. That
// REST route still exists and still works — nothing was deleted — but the
// product grid now goes through /api/graphql instead.
//
// Honest assessment of what the migration bought us here: very little. The REST
// endpoint already returned a tight 7-field DTO, so there was no over-fetching
// to fix. The real win is on the `related` field (see RelatedProducts.tsx),
// where one query now spans two services. For a flat list like this, GraphQL is
// a lateral move — which is a useful thing to have measured rather than assumed.

import { Product } from "@/features/products/types";
import { gqlRequest } from "@/lib/graphql/client";

// The selection set is explicit, which is the one durable difference from REST:
// the response shape is decided HERE, by the caller, rather than fixed by the
// server. Adding a field to the schema doesn't change this payload by a byte.
const PRODUCTS_QUERY = /* GraphQL */ `
  query Products($q: String, $limit: Int) {
    products(q: $q, limit: $limit) {
      products {
        id
        title
        description
        price
        thumbnail
        category
        rating
      }
      pagination {
        total
        totalPages
      }
    }
  }
`;

type ProductsResult = {
  products: {
    products: Product[];
    pagination: { total: number; totalPages: number };
  };
};

// Signature unchanged from the REST version, deliberately — ProductGrid needed
// no edits at all, which keeps the before/after honestly comparable.
export async function fetchProducts(query = ""): Promise<Product[]> {
  // Variables, not string interpolation into the query document. Same
  // discipline as SQL placeholders: the document stays static and the value
  // travels separately, so a search for `") { id } }` is data, not syntax.
  const data = await gqlRequest<ProductsResult>(PRODUCTS_QUERY, {
    q: query.trim() || null,
    limit: 24,
  });

  return data.products.products;
}
