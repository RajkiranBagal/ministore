import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { CartItem } from "./types";

type CartState = {
  items: CartItem[];
};

const initialState: CartState = {
  items: [],
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    // Payload is a CartItem WITHOUT quantity — the reducer sets quantity.
    addItem(state, action: PayloadAction<Omit<CartItem, "quantity">>) {
      const existing = state.items.find((i) => i.id === action.payload.id);
      if (existing) {
        existing.quantity += 1; // already in cart → just bump the count
      } else {
        state.items.push({ ...action.payload, quantity: 1 });
      }
    },

    removeItem(state, action: PayloadAction<number>) {
      state.items = state.items.filter((i) => i.id !== action.payload);
    },

    changeQuantity(
      state,
      action: PayloadAction<{ id: number; quantity: number }>
    ) {
      const item = state.items.find((i) => i.id === action.payload.id);
      if (!item) return;
      if (action.payload.quantity <= 0) {
        // dropping to 0 removes the line entirely
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

export const { addItem, removeItem, changeQuantity, clearCart } =
  cartSlice.actions;

export default cartSlice.reducer;
