// We type only the fields we actually consume, not all 22 the API returns.
// This keeps our type honest about what the app depends on.
export type Product = {
  id: number;
  title: string;
  description: string;
  price: number;
  thumbnail: string;
  category: string;
  rating: number;
};
