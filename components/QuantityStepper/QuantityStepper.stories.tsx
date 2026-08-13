// ─── QuantityStepper stories ────────────────────────────────────────────────
// Shows how to story a CONTROLLED component — the case where plain `args`
// aren't enough. See the note on `render` below.
//
// No `tags: ["autodocs"]` here, unlike Button.stories.tsx, so this component
// gets no generated docs page. Adding the tag would fix that.

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import QuantityStepper from "./QuantityStepper";

const meta: Meta<typeof QuantityStepper> = {
  title: "Components/QuantityStepper",
  component: QuantityStepper,
};

export default meta;

type Story = StoryObj<typeof QuantityStepper>;

// A controlled component needs someone to hold its state. In the story we
// use a little useState wrapper via `render` so it's actually interactive.
//
// With `args: { quantity: 1 }` alone the buttons would appear to do nothing:
// onChange would fire, but no one would update `quantity`, so the display would
// stay frozen at 1 and look broken. `render` lets the story supply the parent
// that a controlled component requires.
export const Interactive: Story = {
  render: () => {
    const [qty, setQty] = useState(1);
    return <QuantityStepper quantity={qty} onChange={setQty} />;
  },
};
