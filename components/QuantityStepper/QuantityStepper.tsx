"use client";

type QuantityStepperProps = {
  quantity: number;
  onChange: (next: number) => void;
  min?: number;
};

// A CONTROLLED, "dumb" component: it knows nothing about Redux or the cart.
// It just shows a number and calls onChange with the requested new value.
// The parent decides what that means. This keeps it reusable anywhere.
export default function QuantityStepper({
  quantity,
  onChange,
  min = 0,
}: QuantityStepperProps) {
  return (
    <div className="inline-flex items-center rounded-md border border-gray-300">
      <button
        type="button"
        aria-label="Decrease quantity"
        onClick={() => onChange(quantity - 1)}
        disabled={quantity <= min}
        className="px-3 py-1 text-lg leading-none text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
      >
        −
      </button>
      <span className="min-w-8 text-center tabular-nums">{quantity}</span>
      <button
        type="button"
        aria-label="Increase quantity"
        onClick={() => onChange(quantity + 1)}
        className="px-3 py-1 text-lg leading-none text-gray-700 hover:bg-gray-100"
      >
        +
      </button>
    </div>
  );
}
