import type { Config } from "jest";
import nextJest from "next/jest.js";

// next/jest wires Jest up to understand your Next.js setup: TypeScript/JSX
// via SWC, path aliases (@/...), CSS module mocks, and .env loading.
const createJestConfig = nextJest({
  dir: "./",
});

const config: Config = {
  coverageProvider: "v8",
  testEnvironment: "jsdom", // simulates a browser DOM so we can render components
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
};

// Exported through createJestConfig so next/jest can load the async Next config.
export default createJestConfig(config);
