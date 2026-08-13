// ─── Vitest configuration — FOR STORYBOOK ONLY ──────────────────────────────
// Easy to misread this file as "the test setup". It isn't. Unit tests run on
// Jest (`npm test`, jest.config.ts); this config exists solely so Storybook can
// smoke-test its stories by rendering each one in a real headless browser.
//
// There is no npm script wired to it and CI never runs it — it's driven by the
// Storybook Vitest addon. Two runners in one repo is unusual; the reason is
// that Storybook 10 standardised on Vitest while next/jest remains the
// best-supported path for Next.js unit tests.

import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';

import { playwright } from '@vitest/browser-playwright';

// __dirname doesn't exist in ES modules, so derive it from import.meta.url.
// The ternary keeps this working under both module systems.
const dirname =
  typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  test: {
    projects: [
      {
        extends: true,
        plugins: [
          // The plugin will run tests for the stories defined in your Storybook config
          // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
          storybookTest({ configDir: path.join(dirname, '.storybook') }),
        ],
        test: {
          name: 'storybook',
          // A REAL browser (headless Chromium via Playwright), not jsdom.
          // Slower, but it exercises actual layout, CSS and events — which is
          // the point of testing stories rather than unit-testing components.
          browser: {
            enabled: true,
            headless: true, // no visible window; required in CI
            provider: playwright({}),
            instances: [{ browser: 'chromium' }],
          },
        },
      },
    ],
  },
});
