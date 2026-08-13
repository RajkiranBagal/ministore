# components/Button/

`Button.tsx` — presentational button. Props: `ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" }`. Tailwind base classes + a variant class map. Default export; `ButtonProps` is **not** exported.

No `"use client"` — intentionally server-safe so Server Components can render it.

`Button.test.tsx` — Jest + RTL + `user-event`, the reference example for this repo's test style: query by role/accessible name, `userEvent.setup()`, globals (`describe`/`test`/`jest.fn()`) with no vitest imports. Four cases: renders accessible name, `onClick` fires, disabled suppresses click, secondary variant has `bg-gray-100`.

`Button.stories.tsx` — `Meta<typeof Button>` from `@storybook/nextjs-vite`, `title: "Components/Button"`, `tags: ["autodocs"]`, stories `Primary` / `Secondary` / `Disabled`.
