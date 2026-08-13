// ─── /account/orders ────────────────────────────────────────────────────────
// Per-user order history. A good example of the "authorization belongs in the
// query" rule: we never load all orders and filter in JS — see lib/orders.ts,
// where `where: { userId }` scopes the rows in the database itself. Filtering
// after the fact is how data leaks happen when someone later edits the render.

import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getUserOrders } from "@/lib/orders";

export default async function OrdersPage() {
  const session = await auth();

  // Belt-and-suspenders: proxy.ts already guards /account/*, but this page
  // passes `session.user.id` straight into a database query, so we re-check
  // rather than trust a matcher pattern that a future edit might change.
  // `redirect()` throws internally, which is why TypeScript accepts the
  // non-null `session.user.id` on the next line.
  if (!session?.user?.id) redirect("/login");

  // Direct database read — Server Components query the DB themselves rather
  // than fetching our own /api routes. The API layer exists for the browser.
  const orders = await getUserOrders(session.user.id);

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900">Order history</h1>

      {/* Always design the empty state — a new account hits this first, and a
          bare page with no explanation reads as a bug. */}
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
            // `key` lets React match elements across re-renders. Use a stable
            // database id, never the array index.
            <li
              key={order.id}
              className="rounded-lg border border-gray-200 p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  {/* Order ids are cuids (~25 chars) — too long to display, so
                      show a recognisable prefix. */}
                  <p className="font-medium">Order #{order.id.slice(0, 8)}</p>
                  <p className="text-sm text-gray-500">
                    {order.createdAt.toLocaleDateString()} · {order.status}
                  </p>
                </div>
                {/* Cents → dollars at the render boundary. The database stores
                    integers so arithmetic is exact; we only divide to display. */}
                <p className="font-semibold">
                  ${(order.totalCents / 100).toFixed(2)}
                </p>
              </div>

              {/* order.items came along in the same query via a nested
                  `include`, so this inner loop costs no extra round-trips.
                  Without it, each order would fire its own query — the classic
                  N+1 problem. */}
              <ul className="mt-3 space-y-2">
                {order.items.map((item) => (
                  <li key={item.id} className="flex items-center gap-3 text-sm">
                    {/* next/image with `fill` needs a positioned ancestor with
                        a real size — that's what this relative h-10 w-10 is for. */}
                    <div className="relative h-10 w-10 shrink-0 rounded bg-gray-100">
                      <Image
                        src={item.product.thumbnail}
                        alt={item.product.title} // real alt text, not "image"
                        fill
                        sizes="40px" // tells Next which widths to generate
                        className="object-contain p-1"
                      />
                    </div>
                    <span className="flex-1">{item.product.title}</span>
                    {/* unitPriceCents is the price AT PURCHASE TIME, snapshotted
                        on the order row. Showing today's product price instead
                        would silently rewrite the customer's receipt. */}
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
