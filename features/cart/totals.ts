import { CartItem } from "./types";

const TAX_RATE = 0.08; // 8% — a constant, not a magic number buried in logic

export type CartTotals = {
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
};

// Rounds to 2 decimal places (cents). Money math with raw floats drifts:
// 0.1 + 0.2 === 0.30000000000000004. Rounding to cents keeps totals honest.
function roundToCents(value: number): number {
  return Math.round(value * 100) / 100;
}

// PURE function: output depends only on its inputs, and it has NO side
// effects (no fetch, no state, no Date.now, no mutation). Same inputs always
// give the same output — which is exactly what makes it a joy to unit-test.
export function calculateTotals(
  items: Pick<CartItem, "price" | "quantity">[],
  couponPercent = 0
): CartTotals {
  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const discount = subtotal * (couponPercent / 100);
  const tax = (subtotal - discount) * TAX_RATE;
  const total = subtotal - discount + tax;

  return {
    subtotal: roundToCents(subtotal),
    discount: roundToCents(discount),
    tax: roundToCents(tax),
    total: roundToCents(total),
  };
}
