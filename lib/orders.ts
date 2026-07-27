import { prisma } from "@/lib/db";

export async function getUserOrders(userId: string) {
  return prisma.order.findMany({
    where: { userId }, // AUTHORIZATION: only THIS user's orders
    orderBy: { createdAt: "desc" },
    include: {
      // Nested include: order -> items -> product, all in ONE query (no N+1).
      items: {
        include: { product: { select: { title: true, thumbnail: true } } },
      },
    },
  });
}
