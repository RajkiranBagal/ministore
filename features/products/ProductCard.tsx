// ─── Product card ───────────────────────────────────────────────────────────
// One tile in the grid. Client component because the add-to-cart button
// dispatches to Redux.
"use client";

import Image from "next/image";
import Link from "next/link";
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
      {/* Only the image + text navigate. The button is intentionally OUTSIDE
          this Link so clicking "Add to cart" doesn't trigger navigation.
          Nesting a <button> inside an <a> is also invalid HTML, and would leave
          keyboard users unable to reach the button predictably. The alternative
          — wrapping everything and calling e.preventDefault() in the handler —
          fixes the click but not the markup. */}
      <Link href={`/products/${product.id}`} className="flex flex-col">
        <div className="relative mb-3 aspect-square overflow-hidden rounded-md bg-gray-100">
          <Image
            src={product.thumbnail}
            alt={product.title}
            fill
            // Matches the grid's breakpoints so the browser downloads an
            // appropriately sized image: half the viewport at 2 columns, a
            // third at 3, a quarter at 4. A wrong `sizes` means over-fetching.
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-contain p-2 transition group-hover:scale-105"
          />
        </div>

        <p className="text-xs uppercase tracking-wide text-gray-500">
          {product.category}
        </p>

        {/* line-clamp-1 truncates to one line so cards stay the same height;
            `title` restores the full text as a hover tooltip. */}
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
          {/* "★ 4.5" is meaningless read aloud, so aria-label supplies a
              sentence a screen reader can actually convey. */}
          <span
            className="text-sm text-gray-600"
            aria-label={`Rating ${product.rating} out of 5`}
          >
            ★ {product.rating.toFixed(1)}
          </span>
        </div>
      </Link>

      {/* Every card has a button reading "Add to cart". Someone tabbing through
          with a screen reader hears the same words 24 times with no idea which
          product each belongs to — aria-label disambiguates them. */}
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

// memo() skips re-rendering when props are unchanged (a shallow compare).
// Worth it here because the grid renders ~24 of these and re-renders whenever
// the search state changes — without memo, typing would re-render every card
// even though their `product` objects are identical.
//
// memo is not free and not a default: it only pays off for components that are
// numerous or expensive AND receive stable props. Note it would do nothing if
// this component took an inline object or arrow-function prop, since those are
// new references on every parent render.
export default memo(ProductCard);
