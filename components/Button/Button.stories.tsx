import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Button from "./Button";

// `meta` describes the component to Storybook: where it lives in the
// sidebar, which component it documents, and default args for every story.
const meta: Meta<typeof Button> = {
  title: "Components/Button",
  component: Button,
  tags: ["autodocs"], // auto-generates a documentation page from your props
  args: {
    children: "Click me",
  },
};

export default meta;

type Story = StoryObj<typeof Button>;

// Each export below is one "story" = the component in a specific state.
export const Primary: Story = {
  args: { variant: "primary" },
};

export const Secondary: Story = {
  args: { variant: "secondary" },
};

export const Disabled: Story = {
  args: { variant: "primary", disabled: true },
};
