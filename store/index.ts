// ─── Redux store ────────────────────────────────────────────────────────────
// One store for the whole app, created once at module load. Currently it holds
// a single slice (the cart) — everything else in this app is either server
// state (fetched per-request) or local component state, and doesn't belong here.
//
// A common mistake is putting fetched data in Redux out of habit. Server data
// has different needs (caching, revalidation, staleness), which is why product
// data lives in Server Components and useState instead.

import { configureStore } from "@reduxjs/toolkit";
import cartReducer from "@/features/cart/cartSlice";

// configureStore is Redux Toolkit's batteries-included setup: it combines
// reducers, wires up the Redux DevTools browser extension, and installs default
// middleware that warns about non-serializable values and accidental mutations.
// Plain Redux's createStore required all of that by hand.
export const store = configureStore({
  reducer: {
    cart: cartReducer, // state.cart is owned by the cart slice
  },
});

// These two types are INFERRED from the store, so they stay correct
// automatically as you add more slices — you never hand-maintain them.
//
// RootState is the shape of the entire state tree ({ cart: {...} }); AppDispatch
// knows about the middleware. Register a second slice above and both types
// update themselves. store/hooks.ts turns them into typed hooks.
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
