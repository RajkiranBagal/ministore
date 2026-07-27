"use client";

import Image from "next/image";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { changeQuantity, removeItem } from "./cartSlice";
import { calculateTotals } from "./totals";
import QuantityStepper from "@/components/QuantityStepper/QuantityStepper";
import CheckoutButton from "./CheckoutButton";

type CartDrawerProps = {
  open: boolean;
  onClose: () => void;
};

export default function CartDrawer({ open, onClose }: CartDrawerProps) {
  // Read the cart items straight from the Redux store.
  const items = useAppSelector((state) => state.cart.items);
  const dispatch = useAppDispatch();

  // Live totals — recomputed every render from current items. Pure function,
  // so this is cheap and predictable.
  const totals = calculateTotals(items);

  return (
    <>
      {/* Backdrop: click outside to close */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* Sliding panel */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-white shadow-xl transition-transform ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <header className="flex items-center justify-between border-b p-4">
          <h2 className="text-lg font-semibold">Your Cart</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close cart"
            className="rounded p-1 text-gray-500 hover:bg-gray-100"
          >
            ✕
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4">
          {items.length === 0 ? (
            <p className="text-center text-gray-500">Your cart is empty.</p>
          ) : (
            <ul className="space-y-4">
              {items.map((item) => (
                <li key={item.id} className="flex gap-3">
                  <div className="relative h-16 w-16 shrink-0 rounded bg-gray-100">
                    <Image
                      src={item.thumbnail}
                      alt={item.title}
                      fill
                      sizes="64px"
                      className="object-contain p-1"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="line-clamp-1 text-sm font-medium">
                      {item.title}
                    </p>
                    <p className="text-sm text-gray-600">
                      ${item.price.toFixed(2)}
                    </p>
                    <div className="mt-1 flex items-center justify-between">
                      <QuantityStepper
                        quantity={item.quantity}
                        onChange={(next) =>
                          dispatch(
                            changeQuantity({ id: item.id, quantity: next })
                          )
                        }
                      />
                      <button
                        type="button"
                        onClick={() => dispatch(removeItem(item.id))}
                        className="text-sm text-red-600 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <footer className="space-y-1 border-t p-4 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal</span>
              <span>${totals.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tax (8%)</span>
              <span>${totals.tax.toFixed(2)}</span>
            </div>
            <div className="mt-2 flex justify-between border-t pt-2 text-base font-semibold">
              <span>Total</span>
              <span>${totals.total.toFixed(2)}</span>
            </div>
            <div className="mt-4">
              <CheckoutButton />
            </div>
          </footer>
        )}
      </aside>
    </>
  );
}
