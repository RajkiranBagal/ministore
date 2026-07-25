"use client";

import { useState } from "react";
import { useAppSelector } from "@/store/hooks";
import CartDrawer from "./CartDrawer";

export default function CartWidget() {
  // `open` is UI state — it belongs to THIS component, not Redux. Notice the
  // deliberate split: cart *data* lives in Redux (shared, global); drawer
  // open/closed lives in local useState. That's the senior state answer.
  const [open, setOpen] = useState(false);

  // A SELECTOR deriving a value: total item count = sum of quantities.
  // Computed in the store read, so the badge updates automatically.
  const count = useAppSelector((state) =>
    state.cart.items.reduce((sum, item) => sum + item.quantity, 0)
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Open cart, ${count} item${count === 1 ? "" : "s"}`}
        className="fixed right-4 top-4 z-30 rounded-full bg-blue-600 px-4 py-2 font-medium text-white shadow-lg hover:bg-blue-700"
      >
        Cart ({count})
      </button>
      <CartDrawer open={open} onClose={() => setOpen(false)} />
    </>
  );
}
