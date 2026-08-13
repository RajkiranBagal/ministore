// ─── Cart money math ────────────────────────────────────────────────────────
// Deliberately a plain module of pure functions, not a component or a selector.
// Money rules are the part of a storefront most worth testing, and pure
// functions test without a renderer, a store, or a mock. See totals.test.ts.

import { CartItem } from "./types";

const TAX_RATE = 0.08; // 8% — a named constant, not a magic number in the logic

export type CartTotals = {
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
};

// Rounds to 2 decimal places (cents). Money math with raw floats drifts:
// 0.1 + 0.2 === 0.30000000000000004. Rounding to cents keeps totals honest.
//
// Note the database avoids this problem entirely by storing integer cents; this
// function exists because the cart works in dollars on the client. Rounding
// only at the END (not after each step) avoids compounding the error.
function roundToCents(value: number): number {
  return Math.round(value * 100) / 100;
}

// PURE function: output depends only on its inputs, and it has NO side
// effects (no fetch, no state, no Date.now, no mutation). Same inputs always
// give the same output — which is exactly what makes it a joy to unit-test.
//
// The `Pick<CartItem, "price" | "quantity">` parameter type is worth noticing:
// it accepts anything with those two fields rather than demanding a full
// CartItem. Tests can pass `[{price: 10, quantity: 2}]` with no fixture, and
// the function honestly advertises that it ignores title and thumbnail.
export function calculateTotals(
  items: Pick<CartItem, "price" | "quantity">[],
  couponPercent = 0
): CartTotals {
  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0 // the initial accumulator — also what an empty cart returns
  );

  // ORDER MATTERS: the discount comes off before tax is calculated, so tax is
  // charged on what the customer actually pays. Taxing first and discounting
  // after would overcharge them — the kind of quiet bug totals.test.ts pins
  // down with an explicit coupon-before-tax case.
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
