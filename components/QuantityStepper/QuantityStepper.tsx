// ─── QuantityStepper ────────────────────────────────────────────────────────
// A −/number/+ control. Needs "use client" because it renders interactive
// buttons that call back on click.
"use client";

type QuantityStepperProps = {
  quantity: number;
  onChange: (next: number) => void;
  min?: number;
};

// A CONTROLLED, "dumb" component: it knows nothing about Redux or the cart.
// It just shows a number and calls onChange with the requested new value.
// The parent decides what that means. This keeps it reusable anywhere.
//
// "Controlled" is the key idea: it holds no useState of its own. The displayed
// number comes entirely from the `quantity` prop, and clicking + doesn't change
// anything locally — it asks the parent to change it, and the new value arrives
// back as a prop. One source of truth (the Redux store), no chance of the
// display and the cart disagreeing.
//
// It's also why this component can live in components/ rather than features/,
// and why it's the easiest kind of component to write a Storybook story for.
export default function QuantityStepper({
  quantity,
  onChange,
  min = 0,
}: QuantityStepperProps) {
  return (
    <div className="inline-flex items-center rounded-md border border-gray-300">
      <button
        type="button"
        // The visible label is "−", which a screen reader may read as "minus"
        // or skip entirely. This says what the control actually does.
        aria-label="Decrease quantity"
        onClick={() => onChange(quantity - 1)}
        // Disable rather than clamp: a disabled button is announced as
        // unavailable, whereas a button that silently does nothing is confusing.
        // The cart passes the default min=0, and its reducer treats reaching 0
        // as "remove this line".
        disabled={quantity <= min}
        className="px-3 py-1 text-lg leading-none text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {/* U+2212 MINUS SIGN, not a hyphen — it matches the + visually. */}
        −
      </button>
      {/* tabular-nums makes every digit the same width, so the control doesn't
          jump around as the number changes from 9 to 10. min-w-8 reserves space. */}
      <span className="min-w-8 text-center tabular-nums">{quantity}</span>
      <button
        type="button"
        aria-label="Increase quantity"
        onClick={() => onChange(quantity + 1)}
        // Deliberately no upper bound here — the component doesn't know about
        // stock. The server enforces that at checkout, atomically.
        className="px-3 py-1 text-lg leading-none text-gray-700 hover:bg-gray-100"
      >
        +
      </button>
    </div>
  );
}
