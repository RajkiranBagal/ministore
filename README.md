# MiniStore

A small but production-shaped **full-stack** e-commerce storefront: a product catalog served from its own PostgreSQL database through a REST API, server-rendered product pages, user accounts with authentication, and a Redux-powered cart with live totals. Built to exercise the modern React/Next.js **and** backend toolchain end to end.

**Live demo:** [ministore-pi.vercel.app](https://ministore-pi.vercel.app/)

---

## Features

- **Product catalog** — served from a PostgreSQL database via a REST API, with **server-side** search, pagination, and sorting.
- **Product detail pages** — server-rendered dynamic routes (`/products/[id]`) that query the database directly, with per-page SEO metadata.
- **Authentication** — email/password signup & login (Auth.js), bcrypt-hashed passwords, JWT sessions, protected routes, and rate-limited auth endpoints.
- **Shopping cart** — add / remove / change quantity, with live subtotal, tax, and total.
- **Component library** — reusable UI primitives (`Button`, `QuantityStepper`) documented in Storybook with accessibility checks.
- **Tested** — Jest + React Testing Library covering pure logic, Redux reducers, and components.
- **CI/CD** — GitHub Actions runs lint, tests, and a production build on every push; production deploys are gated behind passing checks.

## Tech stack & why

| Choice                           | Why                                                                                                                                                                 |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Next.js 16 (App Router)**      | File-system routing + Server Components + Route Handlers. Client islands where interactivity is needed; server rendering and direct DB access everywhere else.       |
| **TypeScript**                   | End-to-end type safety — DB models, API responses, component props, Redux state, session shape.                                                                     |
| **PostgreSQL (Neon)**            | Real relational database. Money stored as integer cents; relations between products, users, and orders.                                                            |
| **Prisma (ORM)**                 | Typed schema as the single source of truth for both DB structure and TypeScript types, with versioned migrations. Uses the `pg` driver adapter.                     |
| **Auth.js (NextAuth v5)**        | Authentication — credentials provider, JWT sessions in an httpOnly cookie, route protection. Handles the security-sensitive plumbing.                               |
| **bcrypt**                       | Slow, salted password hashing — a leaked database never exposes plaintext passwords.                                                                               |
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
  layout.tsx          root layout: Providers, header, session-aware chrome
  page.tsx            home (product grid, client island)
  products/[id]/      server-rendered product detail (queries the DB directly)
  api/products/       REST API route handler (validated search + pagination)
  api/auth/           Auth.js catch-all + signup (register) route
  login/ signup/      auth pages
  account/            protected page (gated by proxy.ts)
  Header.tsx          server component — reads the session via auth()
auth.ts               Auth.js config (Credentials provider, Prisma + bcrypt)
auth.config.ts        edge-safe auth config (used by proxy.ts)
proxy.ts              route protection (Next 16's renamed "middleware")
components/           reusable design-system UI + stories + tests
features/
  products/           product grid, card, types
  cart/               cartSlice, CartDrawer, calculateTotals, tests
  auth/               SignOutButton
lib/
  db.ts               Prisma client singleton (pg driver adapter)
  products.ts         server-side data access (React cache())
  validation.ts       Zod schemas (product query, signup)
  rate-limit.ts       in-memory rate limiter
prisma/
  schema.prisma       data model (Product / User / Order / OrderItem)
  migrations/         versioned SQL migrations
  seed.ts             seeds products
store/                Redux store, typed hooks, Providers
```

### Notable decisions

- **Money as integer cents** — the DB stores `priceCents`; dollars are a display concern. No floating-point money.
- **DB model ≠ API response** — route handlers/data functions map database rows to a clean response shape (a DTO), so storage details don't leak to clients.
- **Server vs client boundaries** — the client grid calls the REST API (browsers can't touch the DB); the detail page and header are Server Components that read the DB/session directly.
- **Auth** — bcrypt-hashed passwords, JWT sessions in an httpOnly cookie (safe from XSS), route protection via `proxy.ts` with an edge-safe config split, and rate-limited signup/login endpoints (`429` on abuse).
- **Validated inputs** — every API input is parsed with Zod; invalid input returns `400`, never a crash.
- **`calculateTotals` is a pure function** (`features/cart/totals.ts`) — deterministic and trivially unit-testable.
- **Performance** — server-side search/pagination, `React.memo` on cards, debounced search, `next/image`, and per-request query dedup with React `cache()`.
- **Accessibility** — semantic roles (`dialog`, `alert`), `aria-label`s on icon buttons, keyboard-visible focus rings, and Storybook a11y audits.

## Getting started

Requires a PostgreSQL database (e.g. a free [Neon](https://neon.tech) project).

```bash
npm install

# 1. Configure environment variables in .env
#    DATABASE_URL="postgresql://…"
#    AUTH_SECRET="…"   # generate with: openssl rand -base64 33

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

- ~~Authentication & user accounts~~ ✅
- Cart persistence and order checkout (with DB transactions)
- Caching, rate limiting (shared store), and a system-design write-up
- Stripe payment integration
