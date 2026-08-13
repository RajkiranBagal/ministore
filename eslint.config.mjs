// ─── ESLint configuration (flat config) ─────────────────────────────────────
// The modern "flat config" format: an ARRAY of config objects, applied in
// order, where later entries override earlier ones. It replaced the older
// .eslintrc.json format — worth knowing, because most tutorials online still
// show the old one and the two aren't interchangeable.
//
// Run with `npm run lint`; CI runs it on every push and PR.
//
// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";

import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";

const eslintConfig = defineConfig([
  // Next's recommended rules plus Core Web Vitals checks — these are what flag
  // things like using <img> instead of next/image, or a missing `sizes` prop.
  ...nextVitals,
  // TypeScript-aware rules on top.
  ...nextTs,
  // Turns off ESLint rules that would conflict with Prettier's formatting.
  // Prettier owns formatting; ESLint owns code-quality. Keep this LAST.
  //
  // "LAST" is load-bearing: flat config applies in order, so this only wins if
  // it comes after the configs whose rules it's switching off. Put it earlier
  // and you get the classic symptom — ESLint and Prettier fighting on save,
  // each undoing the other's work.
  prettier,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  ...storybook.configs["flat/recommended"]
]);

export default eslintConfig;
