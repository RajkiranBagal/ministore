# MiniStore

A small but production-shaped **full-stack** e-commerce storefront: a product catalog served from its own PostgreSQL database through a REST API, server-rendered product pages, and a Redux-powered cart with live totals. Built to exercise the modern React/Next.js **and** backend toolchain end to end.

**Live demo:** [ministore-pi.vercel.app](https://ministore-pi.vercel.app/)

---

## Features

- **Product catalog** — served from a PostgreSQL database via a REST API, with **server-side** search, pagination, and sorting.
- **Product detail pages** — server-rendered dynamic routes (`/products/[id]`) that query the database directly, with per-page SEO metadata.
- **Shopping cart** — add / remove / change quantity, with live subtotal, tax, and total.
- **Component library** — reusable UI primitives (`Button`, `QuantityStepper`) documented in Storybook with accessibility checks.
- **Tested** — Jest + React Testing Library covering pure logic, Redux reducers, and components.
- **CI/CD** — GitHub Actions runs lint, tests, and a production build on every push; production deploys are gated behind passing checks.

## Tech stack & why

| Choice                           | Why                                                                                                                                                                 |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Next.js 16 (App Router)**      | File-system routing + Server Components + Route Handlers. Client islands where interactivity is needed; server rendering and direct DB access everywhere else.       |
| **TypeScript**                   | End-to-end type safety — DB models, API responses, component props, Redux state.                                                                                    |
| **PostgreSQL (Neon)**            | Real relational database. Money stored as integer cents; relations between products, users, and orders.                                                            |
| **Prisma (ORM)**                 | Typed schema as the single source of truth for both DB structure and TypeScript types, with versioned migrations. Uses the `pg` driver adapter.                     |
| **Zod**                          | Runtime validation of every API input — types alone don't protect an endpoint from a malformed request.                                                            |
| **Redux Toolkit**                | Cart is shared, cross-page domain state. Slice + Immer keep reducers concise and immutable. UI-only state (e.g. cart drawer open/closed) stays in local `useState`. |
| **Tailwind CSS**                 | Fast, responsive styling co-located with markup.                                                                                                                    |
| **Storybook**                    | Components documented and browsable in isolation, with the a11y addon auditing each.                                                                                |
| **Jest + React Testing Library** | Unit tests for pure logic/reducers, behavior tests for components (queried by role/text, not implementation).                                                       |
| **GitHub Actions + Vercel**      | Automated quality gate; production deploy runs only after lint + tests + build pass.                                                                                |

## Architecture

Organized **by feature**, not by file type, with a shared `components/` layer for the design system and a clear server/client split.

```
app/                  Next.js routes (App Router)
  layout.tsx          root layout: <html>/<body>, Redux Provider, cart widget
  page.tsx            home (product grid, client island)
  products/[id]/      server-rendered product detail (queries the DB directly)
  api/products/       REST API route handler (validated search + pagination)
components/           reusable design-system UI (Button, QuantityStepper) + stories + tests
features/
  products/           product grid, card, types
  cart/               cartSlice, CartDrawer, calculateTotals, tests
lib/
  db.ts               Prisma client singleton (pg driver adapter)
  products.ts         server-side data access (getProduct, React cache())
  validation.ts       Zod schemas for API input
  api.ts              browser-side API client
  useDebounce.ts      debounce hook
prisma/
  schema.prisma       data model (Product / User / Order / OrderItem)
  migrations/         versioned SQL migrations
  seed.ts             seeds products
store/                Redux store, typed hooks, Providers
```

### Notable decisions

- **Money as integer cents** — the DB stores `priceCents`; dollars are a display concern. No floating-point money.
- **DB model ≠ API response** — route handlers/data functions map database rows to a clean response shape (a DTO), so storage details don't leak to clients.
- **Server vs client boundaries** — the client grid calls the REST API (browsers can't touch the DB); the detail page is a Server Component that queries Postgres directly (no HTTP hop).
- **Validated inputs** — every API query is parsed with Zod; invalid input returns `400`, never a crash.
- **`calculateTotals` is a pure function** (`features/cart/totals.ts`) — deterministic and trivially unit-testable.
- **Performance** — server-side search/pagination, `React.memo` on cards, debounced search, `next/image`, and per-request query dedup with React `cache()`.
- **Accessibility** — semantic roles (`dialog`, `alert`), `aria-label`s on icon buttons, keyboard-visible focus rings, and Storybook a11y audits.

## Getting started

Requires a PostgreSQL database (e.g. a free [Neon](https://neon.tech) project).

```bash
npm install

# 1. Configure the database connection
echo 'DATABASE_URL="postgresql://…"' > .env

# 2. Create the tables and seed products
npx prisma migrate dev
npm run db:seed

# 3. Run it
npm run dev        # http://localhost:3000
```

## Scripts

| Command             | Does                              |
| ------------------- | --------------------------------- |
| `npm run dev`       | Start the dev server              |
| `npm run build`     | Production build                  |
| `npm test`          | Run the Jest test suite           |
| `npm run lint`      | Lint with ESLint                  |
| `npm run db:seed`   | Seed the database with products   |
| `npm run storybook` | Launch Storybook at :6006         |

## Data

Product data is seeded into PostgreSQL from the free [DummyJSON](https://dummyjson.com/products) API, then served entirely from the app's own database.

## Roadmap

- Authentication & user accounts (Auth.js)
- Cart persistence and order checkout (with DB transactions)
- Caching, rate limiting, and a system-design write-up
