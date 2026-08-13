// ─── Cart slice (Redux Toolkit) ─────────────────────────────────────────────
// A "slice" bundles one piece of state with the reducers that change it. This
// is the app's only slice; store/index.ts mounts it at `state.cart`.
//
// The cart lives purely in memory: no localStorage, no server persistence, so a
// refresh empties it. Fine for a demo, and the obvious next feature.

import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { CartItem } from "./types";

type CartState = {
  items: CartItem[];
};

const initialState: CartState = {
  items: [],
};

const cartSlice = createSlice({
  name: "cart", // prefixes the generated action types, e.g. "cart/addItem"
  initialState,

  // ⚠️  The reducers below LOOK like they mutate state (`existing.quantity += 1`,
  // `state.items.push(...)`). In plain Redux that would be a bug — reducers must
  // be pure and never mutate. Redux Toolkit makes it safe by running them inside
  // Immer: `state` is a draft proxy that records your "mutations" and produces a
  // brand-new immutable object. You get readable code and correct immutability.
  //
  // The one rule: either mutate the draft OR return a new value — never both in
  // the same reducer.
  reducers: {
    // Payload is a CartItem WITHOUT quantity — the reducer owns that number, so
    // callers can't accidentally add an item with quantity 0 or -5. Omit<> keeps
    // the two definitions in sync automatically.
    addItem(state, action: PayloadAction<Omit<CartItem, "quantity">>) {
      const existing = state.items.find((i) => i.id === action.payload.id);
      if (existing) {
        existing.quantity += 1; // already in cart → just bump the count
      } else {
        state.items.push({ ...action.payload, quantity: 1 });
      }
    },

    removeItem(state, action: PayloadAction<number>) {
      // Reassigning `state.items` is fine inside Immer — it's still a draft.
      state.items = state.items.filter((i) => i.id !== action.payload);
    },

    changeQuantity(
      state,
      action: PayloadAction<{ id: number; quantity: number }>
    ) {
      const item = state.items.find((i) => i.id === action.payload.id);
      if (!item) return; // unknown id → no-op rather than a crash
      if (action.payload.quantity <= 0) {
        // Dropping to 0 removes the line entirely. Storing a zero-quantity row
        // would mean every consumer has to remember to filter it out.
        state.items = state.items.filter((i) => i.id !== action.payload.id);
      } else {
        item.quantity = action.payload.quantity;
      }
    },

    clearCart(state) {
      state.items = [];
    },
  },
});

// createSlice generates an action creator per reducer, so `addItem(product)`
// returns { type: "cart/addItem", payload: product } — no hand-written
// constants or switch statements, which is most of what RTK removes.
export const { addItem, removeItem, changeQuantity, clearCart } =
  cartSlice.actions;

// The reducer is the default export; store/index.ts registers it.
export default cartSlice.reducer;
