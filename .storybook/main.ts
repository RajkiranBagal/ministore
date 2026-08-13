// ─── Storybook configuration ────────────────────────────────────────────────
// Storybook renders components in isolation, outside the app — no routing, no
// database, no login required. It's how you build and review a component's
// states (loading, disabled, error) without clicking through the real UI to
// reach them.
//
// Run with `npm run storybook` (dev server on :6006).

import type { StorybookConfig } from '@storybook/nextjs-vite';

const config: StorybookConfig = {
  // Where to find stories. Note it globs features/ as well as components/, even
  // though no feature has a story yet — the blocker is that preview.tsx has no
  // Redux <Provider> decorator, so anything touching the store would crash.
  // Add that decorator first, then feature stories will be picked up here.
  "stories": [
    "../components/**/*.stories.@(js|jsx|mjs|ts|tsx)",
    "../features/**/*.stories.@(js|jsx|mjs|ts|tsx)"
  ],
  "addons": [
    "@chromatic-com/storybook", // visual regression testing service
    "@storybook/addon-vitest",  // runs each story as a smoke test (vitest.config.ts)
    "@storybook/addon-a11y",    // live accessibility audit per story
    "@storybook/addon-docs",    // generates docs pages from stories + props
    "@storybook/addon-mcp"      // exposes Storybook to AI agents over MCP
  ],
  // The Next-specific builder: understands next/image, next/font, the App
  // Router hooks and the @/ alias, so components render as they do in the app.
  "framework": "@storybook/nextjs-vite",
  // Serves ./public at the root, so /next.svg resolves inside Storybook too.
  "staticDirs": [
    "../public"
  ]
};
export default config;
