// A cart line item = the product info we need to display + how many.
export type CartItem = {
  id: number;
  title: string;
  price: number;
  thumbnail: string;
  quantity: number;
};
