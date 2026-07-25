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
export const Interactive: Story = {
  render: () => {
    const [qty, setQty] = useState(1);
    return <QuantityStepper quantity={qty} onChange={setQty} />;
  },
};
