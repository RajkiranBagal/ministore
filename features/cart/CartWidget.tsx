"use client";

import { useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { useAppSelector } from "@/store/hooks";
import CartDrawer from "./CartDrawer";

export default function CartWidget() {
  const [open, setOpen] = useState(false);

  // True only on the client (after hydration), false during SSR — so the portal
  // never runs where `document` doesn't exist. useSyncExternalStore gives us
  // this WITHOUT calling setState in an effect (which the lint rule flags as a
  // cascading-render smell).
  const mounted = useSyncExternalStore(
    () => () => {}, // subscribe: nothing to subscribe to (no-op)
    () => true, // client snapshot
    () => false // server snapshot
  );

  const count = useAppSelector((state) =>
    state.cart.items.reduce((sum, item) => sum + item.quantity, 0)
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Open cart, ${count} item${count === 1 ? "" : "s"}`}
        className="rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
      >
        Cart ({count})
      </button>

      {/* Render the drawer at document.body (NOT nested in the header) via a
          portal. Fixes the invalid header-inside-header markup and lets the
          modal escape any parent stacking/overflow context. */}
      {mounted &&
        createPortal(
          <CartDrawer open={open} onClose={() => setOpen(false)} />,
          document.body
        )}
    </>
  );
}
