// ─── Button stories ─────────────────────────────────────────────────────────
// A "story" is one component in one state. Stories serve three purposes at
// once: a workbench for building the component in isolation, living
// documentation of its variants, and — via addon-vitest — a smoke test that
// each state still renders.
//
// This is the CSF3 format (Component Story Format 3): stories are plain
// objects, not functions. Older examples you'll find online use CSF2 functions.

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Button from "./Button";

// `meta` describes the component to Storybook: where it lives in the
// sidebar, which component it documents, and default args for every story.
const meta: Meta<typeof Button> = {
  title: "Components/Button",
  component: Button,
  tags: ["autodocs"], // auto-generates a documentation page from your props
  // Default args inherited by EVERY story below, so none of them has to repeat
  // `children`. Individual stories override selectively.
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
