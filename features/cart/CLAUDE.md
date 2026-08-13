# features/cart/ — Cart state + checkout UI

The only Redux slice in the app. Mounted at `state.cart` by `store/index.ts`.

## State layer

| File | Exports |
|---|---|
| `cartSlice.ts` | named: `addItem`, `removeItem`, `changeQuantity`, `clearCart`; **default export is the reducer** |
| `types.ts` | `CartItem = { id, title, price, thumbnail, quantity }` |
| `totals.ts` | `CartTotals`, `calculateTotals(items, couponPercent = 0)` |

- `initialState` is `{ items: [] }`. `addItem` takes `Omit<CartItem, "quantity">` and increments if the id is already present. `changeQuantity` with `quantity <= 0` **deletes the line** rather than storing zero.
- `calculateTotals` is pure and module-private about its constants (`TAX_RATE = 0.08`, `roundToCents`). **Coupon applies before tax.** Money math belongs here, not in components.
- **Cart is memory-only** — no redux-persist, no localStorage. A refresh empties it. `price` here is dollars (a float), unlike the DB's integer cents.

## Components (all `"use client"`)

| File | Role |
|---|---|
| `AddToCartButton.tsx` | dispatches `addItem`; wraps `@/components/Button/Button` |
| `CartWidget.tsx` | header button + `createPortal(<CartDrawer/>, document.body)` |
| `CartDrawer.tsx` | slide-over, `role="dialog" aria-modal`; dispatches `changeQuantity`/`removeItem`, renders `QuantityStepper` + totals + `CheckoutButton` |
| `CheckoutButton.tsx` | `POST /api/orders` with `{items:[{productId, quantity}]}`; 401 → "Please log in to check out."; `clearCart()` on success; local status union `"idle"｜"pending"｜"done"｜"error"` |

`CartWidget` uses `useSyncExternalStore(() => () => {}, () => true, () => false)` as an SSR-safe mounted flag instead of `useEffect` + `setState` — that's intentional, it avoids a hydration mismatch on the portal.

## Tests

`cartSlice.test.ts` (8 reducer cases incl. an immutability check via `expect(next).not.toBe(initial)`) and `totals.test.ts` (subtotal, 8% tax with `toBeCloseTo`, coupon-before-tax). Both Jest, run by `npm test`.
