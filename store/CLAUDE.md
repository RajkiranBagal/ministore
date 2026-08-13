# store/ — Redux Toolkit

**Redux Toolkit 2.12 + react-redux 9.3.** Not zustand. No RTK Query, no custom middleware, no persistence.

| File | Exports |
|---|---|
| `index.ts` | `store` (`configureStore({ reducer: { cart: cartReducer } })`), plus inferred `RootState` and `AppDispatch` types |
| `hooks.ts` | `useAppDispatch`, `useAppSelector` — built with the RTK 2.x `withTypes` API |
| `Providers.tsx` | `"use client"` boundary wrapping `<Provider store={store}>`; default export, used by `app/layout.tsx` |

## Rules

- **Always use `useAppDispatch` / `useAppSelector` from `@/store/hooks`**, never the raw react-redux hooks — the typed versions are the whole point of `hooks.ts`.
- One slice exists: `cart`, defined in `features/cart/cartSlice.ts`. New slices go in their feature folder and get registered in `index.ts`.
- Selectors are **inline arrows at call sites** today (`useAppSelector((s) => s.cart.items)`), not memoized or colocated. Fine for primitives; if you start deriving objects/arrays inside a selector, add `createSelector` rather than following the existing pattern.
- Derived money totals are computed by the pure `calculateTotals()` during render, not by a selector.
- No barrel re-export of the hooks — import `@/store/hooks` and `@/store/Providers` directly.
