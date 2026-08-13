// ─── Jest configuration ─────────────────────────────────────────────────────
// Jest is THE unit-test runner here (`npm test`), and the only suite CI runs.
// Vitest also exists in this repo but serves Storybook only — see
// vitest.config.ts for that distinction.

import type { Config } from "jest";
import nextJest from "next/jest.js";

// next/jest wires Jest up to understand your Next.js setup: TypeScript/JSX
// via SWC, path aliases (@/...), CSS module mocks, and .env loading.
//
// This wrapper is what saves you from hand-configuring Babel, a `moduleNameMapper`
// for the @/ alias, and stub transforms for CSS and image imports — all of which
// you'd otherwise need before a single component test could run.
const createJestConfig = nextJest({
  dir: "./", // where to find next.config.ts and .env
});

const config: Config = {
  coverageProvider: "v8", // V8's built-in coverage — faster than Babel instrumentation
  testEnvironment: "jsdom", // simulates a browser DOM so we can render components

  // Runs after the test framework is installed but before each test file, which
  // is what makes it the right place for global matchers. jest.setup.ts imports
  // @testing-library/jest-dom, adding assertions like .toBeInTheDocument().
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],

  // No `testMatch` override, so Jest's defaults apply: any *.test.ts(x) or
  // *.spec.ts(x) file, and anything in a __tests__ folder. This project
  // colocates tests next to the code they cover.
};

// Exported through createJestConfig so next/jest can load the async Next config.
export default createJestConfig(config);
