import cartReducer, {
  addItem,
  removeItem,
  changeQuantity,
  clearCart,
} from "./cartSlice";

// A reusable product fixture (without quantity — the reducer sets that).
const product = {
  id: 1,
  title: "Test Product",
  price: 10,
  thumbnail: "test.jpg",
};

describe("cartSlice reducer", () => {
  test("returns the initial state", () => {
    // Passing `undefined` as state makes the reducer return its initialState.
    const state = cartReducer(undefined, { type: "@@INIT" });
    expect(state).toEqual({ items: [] });
  });

  test("addItem adds a new product with quantity 1", () => {
    const state = cartReducer(undefined, addItem(product));
    expect(state.items).toHaveLength(1);
    expect(state.items[0]).toEqual({ ...product, quantity: 1 });
  });

  test("addItem bumps quantity when the product already exists", () => {
    const first = cartReducer(undefined, addItem(product));
    const second = cartReducer(first, addItem(product));
    expect(second.items).toHaveLength(1); // still one line…
    expect(second.items[0].quantity).toBe(2); // …with quantity 2
  });

  test("removeItem removes the matching product", () => {
    const withItem = cartReducer(undefined, addItem(product));
    const state = cartReducer(withItem, removeItem(product.id));
    expect(state.items).toHaveLength(0);
  });

  test("changeQuantity updates the quantity", () => {
    const withItem = cartReducer(undefined, addItem(product));
    const state = cartReducer(withItem, changeQuantity({ id: 1, quantity: 5 }));
    expect(state.items[0].quantity).toBe(5);
  });

  test("changeQuantity to 0 removes the item", () => {
    const withItem = cartReducer(undefined, addItem(product));
    const state = cartReducer(withItem, changeQuantity({ id: 1, quantity: 0 }));
    expect(state.items).toHaveLength(0);
  });

  test("clearCart empties the cart", () => {
    let state = cartReducer(undefined, addItem(product));
    state = cartReducer(state, addItem({ ...product, id: 2 }));
    state = cartReducer(state, clearCart());
    expect(state.items).toHaveLength(0);
  });

  test("does not mutate the previous state (immutability)", () => {
    const initial = cartReducer(undefined, addItem(product));
    const next = cartReducer(initial, addItem({ ...product, id: 2 }));
    expect(next).not.toBe(initial); // a NEW object, not the same reference
    expect(initial.items).toHaveLength(1); // original left untouched
  });
});
