import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { checkoutSchema } from "@/lib/validation";
import { errorResponse } from "@/lib/api-response";
import { logger } from "@/lib/logger";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return errorResponse("Not authenticated", 401);
  }
  const userId = session.user.id;

  // Rate-limit checkout: max 10 per minute per IP.
  const limit = rateLimit(`checkout:${clientIp(request)}`, 10, 60_000);
  if (!limit.ok) {
    return errorResponse("Too many requests. Please try again later.", 429);
  }

  const body = await request.json().catch(() => null);
  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("Invalid cart", 400, parsed.error.flatten());
  }
  const { items } = parsed.data;

  try {
    const order = await prisma.$transaction(async (tx) => {
      let totalCents = 0;
      const orderItems: {
        productId: number;
        quantity: number;
        unitPriceCents: number;
      }[] = [];

      for (const item of items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          select: { priceCents: true, title: true },
        });
        if (!product) {
          throw new Error(`Product ${item.productId} not found`);
        }

        const updated = await tx.product.updateMany({
          where: { id: item.productId, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        });
        if (updated.count === 0) {
          throw new Error(`Insufficient stock for "${product.title}"`);
        }

        totalCents += product.priceCents * item.quantity;
        orderItems.push({
          productId: item.productId,
          quantity: item.quantity,
          unitPriceCents: product.priceCents,
        });
      }

      return tx.order.create({
        data: { userId, totalCents, items: { create: orderItems } },
        include: { items: true },
      });
    });

    logger.info("order.created", {
      orderId: order.id,
      userId,
      totalCents: order.totalCents,
      itemCount: order.items.length,
    });

    // Checkout decremented product stock → invalidate the cached product data
    // so product pages reflect the new stock on the next request.
    revalidateTag("products", "max");

    return NextResponse.json(
      { id: order.id, totalCents: order.totalCents, status: order.status },
      { status: 201 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Checkout failed";
    logger.error("order.failed", { userId, message });
    return errorResponse(message, 409);
  }
}
