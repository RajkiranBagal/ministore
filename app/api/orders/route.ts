// ─── POST /api/orders — checkout ────────────────────────────────────────────
// The most safety-critical handler in the app. Three things must hold:
//
//   1. Prices come from the DATABASE, never from the request body. A client
//      that posts `{price: 0.01}` must not be able to buy anything cheaply.
//   2. Stock can't go negative, even when two people check out simultaneously.
//   3. Either the whole order is written, or none of it is — no half-orders
//      where stock was decremented but no Order row exists.
//
// (1) is why we re-read `priceCents` below; (2) is the conditional updateMany;
// (3) is the surrounding $transaction.

import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { checkoutSchema } from "@/lib/validation";
import { errorResponse } from "@/lib/api-response";
import { logger } from "@/lib/logger";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export async function POST(request: Request) {
  // ── Step 1: authenticate ──────────────────────────────────────────────────
  // Auth first, before any work. An anonymous request should cost us as little
  // as possible, and we need `userId` to own the order anyway.
  const session = await auth();
  if (!session?.user?.id) {
    return errorResponse("Not authenticated", 401); // 401 = "who are you?"
  }
  const userId = session.user.id;

  // ── Step 2: rate limit ────────────────────────────────────────────────────
  // Max 10 checkouts per minute per IP. Caps damage from a runaway client or a
  // scripted attack. NOTE: lib/rate-limit.ts is an in-memory Map, so this only
  // holds within one server instance — see its file header for the real fix.
  const limit = rateLimit(`checkout:${clientIp(request)}`, 10, 60_000);
  if (!limit.ok) {
    return errorResponse("Too many requests. Please try again later.", 429);
  }

  // ── Step 3: validate ──────────────────────────────────────────────────────
  // `.catch(() => null)` because request.json() THROWS on malformed JSON — we
  // want a clean 400, not an unhandled exception. safeParse then turns bad
  // shapes into a result object rather than another throw.
  const body = await request.json().catch(() => null);
  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    // `.flatten()` converts Zod's nested error tree into a flat, JSON-friendly
    // { formErrors, fieldErrors } shape that a client can actually display.
    return errorResponse("Invalid cart", 400, parsed.error.flatten());
  }
  const { items } = parsed.data;

  try {
    // ── Step 4: the transaction ─────────────────────────────────────────────
    // Everything inside runs as ONE database transaction. `tx` is a scoped
    // Prisma client — you must use `tx`, not `prisma`, inside, or that query
    // escapes the transaction. If the callback throws, Postgres rolls back
    // every write, including stock decrements from earlier loop iterations.
    const order = await prisma.$transaction(async (tx) => {
      let totalCents = 0;
      const orderItems: {
        productId: number;
        quantity: number;
        unitPriceCents: number;
      }[] = [];

      for (const item of items) {
        // Read the authoritative price and title from the DB. `select` fetches
        // only these two columns — no reason to pull the whole row.
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          select: { priceCents: true, title: true },
        });
        if (!product) {
          throw new Error(`Product ${item.productId} not found`);
        }

        // ── The oversell guard — the subtlest line in the codebase ──────────
        // The naive version is: read stock, check `stock >= quantity` in JS,
        // then write `stock - quantity`. That has a race: two requests can both
        // read stock=1, both decide it's fine, and both decrement to 0 and -1.
        //
        // Instead the CONDITION lives in the WHERE clause, so the database
        // evaluates it and applies the update atomically — no gap between the
        // check and the write. If another transaction already took the stock,
        // no row matches and `count` comes back 0, which we treat as failure.
        // `decrement` likewise happens in SQL (stock = stock - n), not in JS.
        const updated = await tx.product.updateMany({
          where: { id: item.productId, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        });
        if (updated.count === 0) {
          throw new Error(`Insufficient stock for "${product.title}"`);
        }

        // Integer arithmetic only — cents never lose precision the way floats
        // do (0.1 + 0.2 !== 0.3). This is why the schema stores cents.
        totalCents += product.priceCents * item.quantity;
        orderItems.push({
          productId: item.productId,
          quantity: item.quantity,
          // Snapshot the price. If the product's price changes tomorrow, this
          // order must still show what the customer actually paid.
          unitPriceCents: product.priceCents,
        });
      }

      // A nested `create` writes the Order and all its OrderItems in one go,
      // with the foreign keys wired up automatically.
      return tx.order.create({
        data: { userId, totalCents, items: { create: orderItems } },
        include: { items: true }, // so we can read items.length below
      });
    });

    // Structured log — one JSON object per line, queryable in a log aggregator.
    logger.info("order.created", {
      orderId: order.id,
      userId,
      totalCents: order.totalCents,
      itemCount: order.items.length,
    });

    // Checkout decremented product stock → invalidate the cached product data
    // so product pages reflect the new stock on the next request. The "products"
    // tag is attached in lib/products.ts; "max" revalidates the strongest layer.
    revalidateTag("products", "max");

    return NextResponse.json(
      { id: order.id, totalCents: order.totalCents, status: order.status },
      { status: 201 } // 201 Created — a new resource exists
    );
  } catch (err) {
    // KNOWN ROUGH EDGE: every failure lands here as a 409 with the raw error
    // message forwarded to the client. So "insufficient stock" (the user's
    // problem, genuinely a 409 Conflict) is indistinguishable from a dropped
    // database connection (our problem, really a 500) — and internal messages
    // leak outward. Splitting these into typed errors is the natural next fix.
    const message = err instanceof Error ? err.message : "Checkout failed";
    logger.error("order.failed", { userId, message });
    return errorResponse(message, 409);
  }
}
