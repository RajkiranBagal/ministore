"use client";

import { useState } from "react";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { clearCart } from "./cartSlice";
import Button from "@/components/Button/Button";

export default function CheckoutButton() {
  const items = useAppSelector((s) => s.cart.items);
  const dispatch = useAppDispatch();
  const [status, setStatus] = useState<"idle" | "pending" | "done" | "error">(
    "idle"
  );
  const [message, setMessage] = useState("");

  async function handleCheckout() {
    setStatus("pending");
    setMessage("");

    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: items.map((i) => ({ productId: i.id, quantity: i.quantity })),
      }),
    });

    if (res.status === 401) {
      setStatus("error");
      setMessage("Please log in to check out.");
      return;
    }
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setStatus("error");
      setMessage(data.error ?? "Checkout failed.");
      return;
    }

    dispatch(clearCart());
    setStatus("done");
    setMessage("Order placed! 🎉");
  }

  return (
    <div className="space-y-2">
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
        disabled={status === "pending" || items.length === 0}
      >
        {status === "pending" ? "Placing order…" : "Checkout"}
      </Button>
    </div>
  );
}
