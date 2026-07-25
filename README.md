# MiniStore

A small but production-shaped e-commerce storefront: a searchable product catalog, server-rendered product pages, and a Redux-powered cart with live totals. Built to exercise the full modern React/Next.js toolchain end to end.

**Live demo:** [ministore-pi.vercel.app](https://ministore-pi.vercel.app/)

---

## Features

- **Product grid** — fetched from a public REST API, with debounced search and explicit loading/error states.
- **Product detail pages** — server-rendered dynamic routes (`/products/[id]`) with per-page SEO metadata.
- **Shopping cart** — add / remove / change quantity, with live subtotal, tax, and total.
- **Component library** — reusable UI primitives (`Button`, `QuantityStepper`) documented in Storybook with accessibility checks.
- **Tested** — Jest + React Testing Library covering pure logic, Redux reducers, and components.
- **CI** — GitHub Actions runs lint, tests, and a production build on every push.

## Tech stack & why

| Choice                           | Why                                                                                                                                                                 |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Next.js 16 (App Router)**      | File-system routing + Server Components. The product grid is a client island; product detail is server-rendered for SEO and fast first paint.                       |
| **TypeScript**                   | End-to-end type safety — API responses, component props, Redux state.                                                                                               |
| **Redux Toolkit**                | Cart is shared, cross-page domain state. Slice + Immer keep reducers concise and immutable. UI-only state (e.g. cart drawer open/closed) stays in local `useState`. |
| **Tailwind CSS**                 | Fast, responsive styling co-located with markup.                                                                                                                    |
| **Storybook**                    | Components documented and browsable in isolation, with the a11y addon auditing each.                                                                                |
| **Jest + React Testing Library** | Unit tests for pure logic/reducers, behavior tests for components (queried by role/text, not implementation).                                                       |
| **GitHub Actions**               | Automated quality gate — nothing merges without passing lint + tests + build.                                                                                       |

## Architecture

Organized **by feature**, not by file type, so related code changes together, with a shared `components/` layer for the design system.

```
app/                  Next.js routes (App Router)
  layout.tsx          root layout: <html>/<body>, Redux Provider, cart widget
  page.tsx            home (product grid)
  products/[id]/      server-rendered product detail
components/           reusable design-system UI (Button, QuantityStepper) + stories + tests
features/
  products/           product grid, card, types
  cart/               cartSlice, CartDrawer, calculateTotals, tests
lib/                  API client, useDebounce hook
store/                Redux store, typed hooks, Providers
```

### Notable decisions

- **`calculateTotals` is a pure function** (`features/cart/totals.ts`) — deterministic, side-effect-free, and the easiest thing in the app to unit-test.
- **Server vs client boundaries** — pages stay Server Components; interactivity (cart, search) lives in small `"use client"` islands.
- **Performance** — `React.memo` on product cards, `useMemo` for filtering, debounced search, and `next/image` optimization.
- **Accessibility** — semantic roles (`dialog`, `alert`), `aria-label`s on icon buttons, keyboard-visible focus rings, and Storybook a11y audits.

## Getting started

```bash
npm install
npm run dev        # http://localhost:3000
```

## Scripts

| Command             | Does                      |
| ------------------- | ------------------------- |
| `npm run dev`       | Start the dev server      |
| `npm run build`     | Production build          |
| `npm test`          | Run the Jest test suite   |
| `npm run lint`      | Lint with ESLint          |
| `npm run storybook` | Launch Storybook at :6006 |

## Data source

Products come from the free [DummyJSON](https://dummyjson.com/products) API (no key required).
