// ─── Cart button + drawer host ──────────────────────────────────────────────
// Lives in the header. Shows the item count and owns the open/closed state of
// the drawer it renders through a portal.
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
  //
  // The trick: this hook takes separate client and server snapshot functions,
  // and React calls the right one for the environment. During SSR it returns
  // false; after hydration, true. The usual useEffect(() => setMounted(true))
  // achieves the same thing with an extra render pass — this is the modern form.
  //
  // Why it's needed at all: rendering the portal on the server would crash on
  // `document`, and rendering DIFFERENT markup on server vs client causes a
  // hydration mismatch. Gating on `mounted` sidesteps both.
  const mounted = useSyncExternalStore(
    () => () => {}, // subscribe: nothing to subscribe to, so return a no-op unsubscribe
    () => true, // client snapshot
    () => false // server snapshot
  );

  // Derives the badge count from the store. Summing quantities (rather than
  // items.length) means 3 of one product shows "3", not "1".
  //
  // Computing inside the selector is safe HERE because the result is a number:
  // react-redux compares snapshots with ===, and primitives compare by value.
  // A selector returning a new object or array each call would re-render on
  // every store change — that's when you'd reach for createSelector.
  const count = useAppSelector((state) =>
    state.cart.items.reduce((sum, item) => sum + item.quantity, 0)
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        // The visible label reads "Cart (3)", which a screen reader would
        // announce as bare punctuation. This spells it out, and pluralises.
        aria-label={`Open cart, ${count} item${count === 1 ? "" : "s"}`}
        className="rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
      >
        Cart ({count})
      </button>

      {/* Render the drawer at document.body (NOT nested in the header) via a
          portal. Fixes the invalid header-inside-header markup and lets the
          modal escape any parent stacking/overflow context.

          A portal moves the DOM node elsewhere but keeps it in the React tree,
          so props, context and the Redux store all still work — the drawer is
          "inside" this component logically, just not physically. Without it,
          the header's `overflow` and z-index would clip the overlay. */}
      {mounted &&
        createPortal(
          <CartDrawer open={open} onClose={() => setOpen(false)} />,
          document.body
        )}
    </>
  );
}
