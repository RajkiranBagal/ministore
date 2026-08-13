// ─── Money math tests ───────────────────────────────────────────────────────
// The easiest tests to write in the whole codebase, because calculateTotals is
// a pure function: no store, no mocks, no rendering, no setup. Call it with
// inputs, assert on the output.
//
// That ease is the argument for keeping business rules in pure functions rather
// than inside components. Testing "does an 8% tax apply?" through a rendered
// cart drawer would need a Redux provider, a mock store and a DOM query, and
// would still be testing the rule less directly.

import { calculateTotals } from "./totals";

// describe() groups related tests under one label. Purely organizational.
describe("calculateTotals", () => {
  // Each test() is one case: a name + a function with assertions.
  test("empty cart totals to zero", () => {
    const result = calculateTotals([]);
    expect(result.subtotal).toBe(0);
    expect(result.total).toBe(0);
  });

  test("sums subtotal from price × quantity", () => {
    const items = [
      { price: 100, quantity: 2 },
      { price: 50, quantity: 1 },
    ];
    expect(calculateTotals(items).subtotal).toBe(250);
  });

  test("applies 8% tax to the subtotal", () => {
    const items = [{ price: 100, quantity: 1 }]; // subtotal 100
    const { tax, total } = calculateTotals(items);
    // toBeCloseTo, not toBe, for money math — guards against float drift.
    expect(tax).toBeCloseTo(8, 2); // 8% of 100
    expect(total).toBeCloseTo(108, 2); // 100 + 8
  });

  // The most valuable test here: it pins down ORDER OF OPERATIONS. Taxing
  // before discounting would also produce plausible-looking numbers, just
  // wrong ones — the kind of bug that ships quietly and overcharges people.
  test("applies a 10% coupon before tax", () => {
    const items = [{ price: 100, quantity: 2 }]; // subtotal 200
    const { subtotal, discount, tax, total } = calculateTotals(items, 10);
    expect(subtotal).toBe(200);
    expect(discount).toBe(20); // 10% of 200
    expect(tax).toBeCloseTo(14.4, 2); // 8% of (200 − 20)
    expect(total).toBeCloseTo(194.4, 2); // 200 − 20 + 14.4
  });
});
