"use client";

import Button from "@/components/Button/Button";
import { useAppDispatch } from "@/store/hooks";
import { addItem } from "./cartSlice";
import { CartItem } from "./types";

export default function AddToCartButton({
  product,
}: {
  product: Omit<CartItem, "quantity">;
}) {
  const dispatch = useAppDispatch();
  return (
    <Button onClick={() => dispatch(addItem(product))}>Add to cart</Button>
  );
}
