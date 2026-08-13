# .storybook/

Storybook 10 on the `@storybook/nextjs-vite` framework.

- `main.ts` — story globs `../components/**/*.stories.*` and `../features/**/*.stories.*`; addons: `@chromatic-com/storybook`, `addon-vitest`, `addon-a11y`, `addon-docs`, `addon-mcp`; `staticDirs: ["../public"]`.
- `preview.tsx` — `Preview` with `color`/`date` control matchers and `a11y.test: "todo"` (violations surface in the test UI but don't fail anything).

## Two things that trip people up

1. **There is no global Redux `<Provider>` decorator.** That's the reason only store-free components (`Button`, `QuantityStepper`) have stories and nothing under `features/` does. Add the decorator here before writing a story for a connected component.
2. **The Vitest project only exists for Storybook.** `vitest.config.ts` defines a single project named `storybook` using `storybookTest({ configDir: ".storybook" })` in headless Chromium via `@vitest/browser-playwright`. There is **no `vitest` npm script and CI never runs it** — `npm test` is Jest only. Unit tests go to Jest; this runner is story smoke-testing.

```bash
npm run storybook        # dev on :6006
npm run build-storybook
```
