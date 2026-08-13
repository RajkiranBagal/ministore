// A cart line item = the product info we need to display + how many.
//
// Deliberately NOT the Prisma Product model. The cart only needs enough to
// render a row and price it, so importing the database type here would drag in
// stock, description and createdAt — fields the cart has no business holding,
// and which would then be serialized into client-side Redux state.
//
// Note `price` is DOLLARS here (a float), while the database stores integer
// cents. Conversion happens once at the API boundary; features/cart/totals.ts
// rounds carefully because of it.
export type CartItem = {
  id: number; // Product.id — the key for deduping lines
  title: string;
  price: number;
  thumbnail: string;
  quantity: number;
};
