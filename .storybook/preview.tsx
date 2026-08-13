// ─── Storybook preview (global story config) ────────────────────────────────
// main.ts configures the Storybook BUILD; this file configures how every story
// RENDERS. Global decorators, parameters and styling go here.
//
// ⚠️  Notably absent: a Redux <Provider> decorator, and an import of
// app/globals.css. That's why only store-free, minimally-styled components
// (Button, QuantityStepper) have stories today. Adding:
//
//     import "../app/globals.css";
//     export const decorators = [(Story) => <Provider store={store}><Story/></Provider>];
//
// is what would unlock stories for cart and product components.

import type { Preview } from "@storybook/nextjs-vite";

const preview: Preview = {
  parameters: {
    controls: {
      // "Controls" are the interactive prop editors in the Storybook sidebar.
      // These regexes tell Storybook to infer a richer editor from the prop
      // NAME: anything ending in "background"/"color" gets a colour picker,
      // anything ending in "Date" gets a date picker.
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },

    a11y: {
      // The a11y addon runs axe-core against each rendered story.
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      //
      // Currently 'todo': violations are visible but nothing fails. Switching
      // to 'error' is the move once existing issues are cleared — though note
      // CI doesn't run the Storybook suite at all right now.
      test: "todo",
    },
  },
};

export default preview;
