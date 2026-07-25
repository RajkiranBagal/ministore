"use client";

import Image from "next/image";
import { memo } from "react";
import Button from "@/components/Button/Button";
import { useAppDispatch } from "@/store/hooks";
import { addItem } from "@/features/cart/cartSlice";
import { Product } from "./types";

type ProductCardProps = {
  product: Product;
};

function ProductCard({ product }: ProductCardProps) {
  const dispatch = useAppDispatch();

  return (
    <div className="group flex flex-col rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md">
      <div className="relative mb-3 aspect-square overflow-hidden rounded-md bg-gray-100">
        <Image
          src={product.thumbnail}
          alt={product.title}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-contain p-2 transition group-hover:scale-105"
        />
      </div>

      <p className="text-xs uppercase tracking-wide text-gray-500">
        {product.category}
      </p>

      <h3
        className="line-clamp-1 font-medium text-gray-900"
        title={product.title}
      >
        {product.title}
      </h3>

      <div className="mt-2 flex items-center justify-between">
        <span className="font-semibold text-gray-900">
          ${product.price.toFixed(2)}
        </span>
        <span
          className="text-sm text-gray-600"
          aria-label={`Rating ${product.rating} out of 5`}
        >
          ★ {product.rating.toFixed(1)}
        </span>
      </div>

      <Button
        className="mt-3 w-full"
        aria-label={`Add ${product.title} to cart`}
        onClick={() =>
          dispatch(
            addItem({
              id: product.id,
              title: product.title,
              price: product.price,
              thumbnail: product.thumbnail,
            })
          )
        }
      >
        Add to cart
      </Button>
    </div>
  );
}

export default memo(ProductCard);
