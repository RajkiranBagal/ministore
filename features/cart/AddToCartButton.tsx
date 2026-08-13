// ─── Add to cart ────────────────────────────────────────────────────────────
// The smallest possible client island: a Server Component can't dispatch to
// Redux (no hooks, no browser), so the interactive bit is split into this tiny
// "use client" component and dropped into the server-rendered product page.
// Keeping it this small keeps the JavaScript shipped to the browser small.
"use client";

import Button from "@/components/Button/Button";
import { useAppDispatch } from "@/store/hooks";
import { addItem } from "./cartSlice";
import { CartItem } from "./types";

export default function AddToCartButton({
  product,
}: {
  // Omit<CartItem, "quantity"> — the caller supplies the product fields, and
  // the reducer decides the quantity (1, or +1 if already in the cart). Using
  // Omit rather than a hand-written type means this signature updates itself
  // whenever CartItem changes.
  product: Omit<CartItem, "quantity">;
}) {
  const dispatch = useAppDispatch();
  return (
    <Button onClick={() => dispatch(addItem(product))}>Add to cart</Button>
  );
}
