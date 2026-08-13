// ─── Checkout button ────────────────────────────────────────────────────────
// Turns the client-side cart into a real order by POSTing to /api/orders.
"use client";

import { useState } from "react";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { clearCart } from "./cartSlice";
import Button from "@/components/Button/Button";

export default function CheckoutButton() {
  const items = useAppSelector((s) => s.cart.items);
  const dispatch = useAppDispatch();

  // A four-state union instead of two booleans (isLoading / isError). Booleans
  // let you express nonsense — loading AND error at once — while a union makes
  // the impossible states unrepresentable. TypeScript also catches typos here.
  const [status, setStatus] = useState<"idle" | "pending" | "done" | "error">(
    "idle"
  );
  const [message, setMessage] = useState("");

  async function handleCheckout() {
    setStatus("pending");
    setMessage(""); // clear any message from a previous attempt

    // Send ONLY ids and quantities. Prices are deliberately not transmitted:
    // the server re-reads them from the database, so a tampered request body
    // can't buy a laptop for a penny. See app/api/orders/route.ts.
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: items.map((i) => ({ productId: i.id, quantity: i.quantity })),
      }),
    });

    // 401 gets its own branch with an actionable message. The generic handler
    // below would show the server's "Not authenticated", which tells the user
    // nothing about what to DO — this tells them to log in.
    if (res.status === 401) {
      setStatus("error");
      setMessage("Please log in to check out.");
      return;
    }
    if (!res.ok) {
      // `.catch(() => ({}))` in case the error body isn't JSON; the `??` then
      // supplies a fallback so the user never sees "undefined".
      const data = await res.json().catch(() => ({}));
      setStatus("error");
      setMessage(data.error ?? "Checkout failed.");
      return;
    }

    // Only clear the cart AFTER the server confirms. Clearing optimistically
    // would lose the customer's basket whenever checkout failed.
    dispatch(clearCart());
    setStatus("done");
    setMessage("Order placed! 🎉");
  }

  return (
    <div className="space-y-2">
      {/* role="status" announces changes politely — it waits for a screen
          reader to finish its current sentence, unlike role="alert", which
          interrupts. Right choice for a success/progress message. */}
      {message && (
        <p
          className={`text-sm ${status === "error" ? "text-red-600" : "text-green-600"}`}
          role="status"
        >
          {message}
        </p>
      )}
      <Button
        className="w-full"
        onClick={handleCheckout}
        // Two guards in one: no double-submitting an in-flight order, and no
        // pointless request for an empty cart (the server would 400 anyway,
        // since checkoutSchema requires at least one item).
        disabled={status === "pending" || items.length === 0}
      >
        {status === "pending" ? "Placing order…" : "Checkout"}
      </Button>
    </div>
  );
}
