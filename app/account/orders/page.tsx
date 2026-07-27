import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getUserOrders } from "@/lib/orders";

export default async function OrdersPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login"); // belt-and-suspenders (proxy also guards /account)

  const orders = await getUserOrders(session.user.id);

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900">Order history</h1>

      {orders.length === 0 ? (
        <p className="mt-4 text-gray-500">
          You have no orders yet.{" "}
          <Link href="/" className="text-blue-600 hover:underline">
            Start shopping
          </Link>
          .
        </p>
      ) : (
        <ul className="mt-6 space-y-4">
          {orders.map((order) => (
            <li
              key={order.id}
              className="rounded-lg border border-gray-200 p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Order #{order.id.slice(0, 8)}</p>
                  <p className="text-sm text-gray-500">
                    {order.createdAt.toLocaleDateString()} · {order.status}
                  </p>
                </div>
                <p className="font-semibold">
                  ${(order.totalCents / 100).toFixed(2)}
                </p>
              </div>

              <ul className="mt-3 space-y-2">
                {order.items.map((item) => (
                  <li key={item.id} className="flex items-center gap-3 text-sm">
                    <div className="relative h-10 w-10 shrink-0 rounded bg-gray-100">
                      <Image
                        src={item.product.thumbnail}
                        alt={item.product.title}
                        fill
                        sizes="40px"
                        className="object-contain p-1"
                      />
                    </div>
                    <span className="flex-1">{item.product.title}</span>
                    <span className="text-gray-500">
                      {item.quantity} × $
                      {(item.unitPriceCents / 100).toFixed(2)}
                    </span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
