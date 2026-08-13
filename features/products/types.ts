// We type only the fields we actually consume, not all 22 the API returns.
// This keeps our type honest about what the app depends on.
//
// This is the API/UI shape, deliberately NOT the Prisma Product model. Two
// differences matter:
//
//   • `price` is DOLLARS here; the database column is `priceCents` (an integer).
//     Conversion happens once, at the API boundary.
//   • `stock` and `createdAt` are absent — internal fields that /api/products
//     intentionally drops before responding.
//
// Keeping the database model and the public shape as separate types means
// adding a column doesn't silently publish it, and the compiler tells you if a
// component starts depending on something the API never sends.
export type Product = {
  id: number;
  title: string;
  description: string;
  price: number;
  thumbnail: string;
  category: string;
  rating: number;
};
