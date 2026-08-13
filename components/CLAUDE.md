# components/ — Shared presentational UI

Generic, reusable, **Redux-free** components. Anything that touches the store or a feature domain belongs in `features/`, not here.

## Layout convention

One folder per component: `Name/Name.tsx` + optional `Name.test.tsx` + `Name.stories.tsx`, colocated. **No barrel `index.ts` anywhere** — import the full path: `@/components/Button/Button`.

Default export for the component; same-folder imports stay relative (`./Button`), cross-folder use `@/`.

## What's here

| Component | Client? | Tested | Story |
|---|---|---|---|
| `Button/Button.tsx` | no — server-safe | ✅ `Button.test.tsx` | ✅ autodocs |
| `QuantityStepper/QuantityStepper.tsx` | `"use client"` | ❌ | ✅ interactive |

- **Button** — `ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" }`, Tailwind base + variant class map. `ButtonProps` is not exported. No `"use client"`, so it works inside Server Components.
- **QuantityStepper** — controlled: `{ quantity, onChange, min = 0 }`. `aria-label` on the −/+ buttons; decrement disabled at `min`. Deliberately store-agnostic — the parent dispatches.

## Stories caveat

`.storybook/preview.tsx` has **no Redux `<Provider>` decorator**. That's why only store-free components have stories. Adding a story for a connected component requires adding that decorator first.
