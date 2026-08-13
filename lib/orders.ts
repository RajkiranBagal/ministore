// ─── Order history queries ──────────────────────────────────────────────────
// SERVER-ONLY. Used by app/account/orders/page.tsx.

import { prisma } from "@/lib/db";

// Note the signature: `userId` is REQUIRED, not optional. There's deliberately
// no getAllOrders() or getOrders(userId?) that could be called without a user —
// making the unsafe version impossible to write is better than remembering not
// to call it.
export async function getUserOrders(userId: string) {
  return prisma.order.findMany({
    // AUTHORIZATION: only THIS user's orders.
    //
    // This one line is the entire access control for order history, and it
    // belongs HERE, in the query — not as a `.filter()` after fetching. Two
    // reasons: fetching everything and filtering in JS means the data was
    // already loaded (one careless render away from leaking), and it doesn't
    // scale. Postgres uses the @@index([userId]) to jump straight to these rows.
    where: { userId },

    orderBy: { createdAt: "desc" }, // newest first
    include: {
      // Nested include: order -> items -> product, all in ONE query (no N+1).
      //
      // The N+1 problem: fetch 10 orders, then loop and fetch each order's
      // items = 11 queries. Add product lookups and it's 50+. Prisma resolves
      // this whole tree in a single round-trip instead.
      items: {
        // `select` on the product limits it to the two fields the UI renders.
        // Without it we'd pull description, stock and priceCents for every line
        // item — wasted bytes, and priceCents would be misleading here anyway,
        // since the order stores its own unitPriceCents snapshot.
        include: { product: { select: { title: true, thumbnail: true } } },
      },
    },
  });
}
