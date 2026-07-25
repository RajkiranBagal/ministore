import { configureStore } from "@reduxjs/toolkit";
import cartReducer from "@/features/cart/cartSlice";

export const store = configureStore({
  reducer: {
    cart: cartReducer, // state.cart is owned by the cart slice
  },
});

// These two types are INFERRED from the store, so they stay correct
// automatically as you add more slices — you never hand-maintain them.
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
