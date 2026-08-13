# components/QuantityStepper/

`QuantityStepper.tsx` — `"use client"` controlled stepper. Props `{ quantity, onChange, min = 0 }`. `aria-label` on each of the −/+ buttons; decrement is disabled at `min`.

Store-agnostic by design — `features/cart/CartDrawer.tsx` owns the `changeQuantity` dispatch. Keep Redux out of this file.

`QuantityStepper.stories.tsx` — `title: "Components/QuantityStepper"`, no autodocs tag, single `Interactive` story that uses a `render:` function with local `useState` to drive the controlled props.

**No test file exists** for this component — `Button` is currently the only unit-tested component.
