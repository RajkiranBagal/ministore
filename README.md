# MiniStore

A small but production-shaped **full-stack, polyglot** e-commerce storefront: a product catalog served from its own PostgreSQL database, user accounts with authentication, a checkout backed by database transactions, order history, and a **Python FastAPI microservice** for recommendations. Built to exercise the modern React/Next.js **and** backend toolchain end to end.

**Live demo:** [ministore-pi.vercel.app](https://ministore-pi.vercel.app/)
**Recommendations service (FastAPI):** [ministore-recommendations.onrender.com/docs](https://ministore-recommendations.onrender.com/docs)

---

## Features

- **Product catalog** — served from PostgreSQL via a REST API, with **server-side** search, pagination, and sorting.
- **Product detail pages** — server-rendered dynamic routes (`/products/[id]`) that query the database directly, with per-page SEO metadata.
- **Authentication** — email/password signup & login (Auth.js), bcrypt-hashed passwords, JWT sessions, protected routes, rate-limited auth endpoints.
- **Cart & checkout** — add / remove / change quantity with live totals; checkout runs inside a **database transaction** (server-side pricing, atomic stock decrement, no overselling), plus per-user **order history**.
- **Recommendations** — a separate **FastAPI (Python)** microservice powers the "You might also like" section, called cross-origin from the product page.
- **Component library** — reusable UI primitives (`Button`, `QuantityStepper`) documented in Storybook with accessibility checks.
- **Tested** — Jest + React Testing Library covering pure logic, Redux reducers, and components.
- **CI/CD** — GitHub Actions runs lint, tests, and a production build on every push; production deploys are gated behind passing checks.

## Architecture

A polyglot, multi-service system — each part deployed independently:

```
                    ┌─────────────────────────────┐
  Browser  ───────► │  Next.js frontend (Vercel)  │
                    └──────────┬──────────┬────────┘
                               │          │
        Next API routes +      │          │   cross-origin fetch
        Server Components      │          │   (recommendations)
                               ▼          ▼
                    ┌────────────────┐   ┌──────────────────────────┐
                    │ PostgreSQL     │◄──┤ FastAPI service (Render)  │
                    │ (Neon)         │   │ Python · recommendations  │
                    └────────────────┘   └──────────────────────────┘
```

- **Next.js** owns products, auth, cart, and orders (Route Handlers + Server Components + Prisma).
- **FastAPI** owns recommendations (its own deploy, reads the same Postgres).
- Both share the **Neon** database; the frontend talks to Next's own API for most things and to FastAPI for recommendations.

## Tech stack & why

| Choice | Why |
| --- | --- |
| **Next.js 16 (App Router)** | File-system routing, Server Components, Route Handlers. Client islands for interactivity; server rendering + direct DB access elsewhere. |
| **TypeScript** | End-to-end type safety — DB models, API responses, component props, Redux state, session shape. |
| **PostgreSQL (Neon)** | Relational database. Money as integer cents; relations between products, users, and orders. |
| **Prisma (ORM)** | Typed schema as the single source of truth for DB structure + TS types, with versioned migrations; `pg` driver adapter. |
| **Auth.js (NextAuth v5)** | Credentials auth, JWT sessions in an httpOnly cookie, route protection. |
| **bcrypt** | Slow, salted password hashing — a leaked DB never exposes plaintext. |
| **Zod** | Runtime validation of every API input — types alone don't protect an endpoint at runtime. |
| **Redux Toolkit** | Shared cart state (slice + Immer); UI-only state stays in local `useState`. |
| **FastAPI (Python)** | The recommendations microservice — Pydantic models, async, parameterized SQL, auto Swagger docs. Demonstrates a polyglot architecture. |
| **Tailwind CSS** | Fast, responsive styling co-located with markup. |
| **Storybook** | Components documented in isolation, with the a11y addon. |
| **Jest + React Testing Library** | Unit tests for logic/reducers; behavior tests for components. |
| **GitHub Actions + Vercel + Render** | Automated quality gate; Next.js deploys to Vercel (gated behind CI), the FastAPI service to Render. |

## Project structure

Organized **by feature**, with a shared `components/` design-system layer and a clear server/client split.

```
app/                  Next.js routes (App Router)
  layout.tsx          root layout: Providers + header (session-aware)
  page.tsx            home (product grid)
  products/[id]/      server-rendered product detail
  api/products/       REST products API (validated search + pagination)
  api/orders/         checkout (POST) — DB transaction
  api/auth/           Auth.js catch-all + signup (register)
  login/ signup/      auth pages
  account/            protected: account + orders/ (order history)
auth.ts, auth.config.ts, proxy.ts   auth config + route protection
components/           reusable design-system UI + stories + tests
features/
  products/           grid, card, RelatedProducts (FastAPI-backed), types
  cart/               cartSlice, CartDrawer, CheckoutButton, calculateTotals, tests
  auth/               SignOutButton
lib/
  db.ts               Prisma client singleton
  products.ts orders.ts   server-side data access (React cache())
  validation.ts       Zod schemas
  api-response.ts     consistent error envelope
  logger.ts           structured JSON logging
  rate-limit.ts       in-memory rate limiter
prisma/               schema, migrations, seed
store/                Redux store, typed hooks, Providers
services/
  recommendations/    FastAPI microservice (main.py, requirements.txt)
render.yaml           Render blueprint for the FastAPI service
```

### Notable decisions

- **Money as integer cents** — no floating-point money; dollars are a display concern.
- **DB model ≠ API response** — data functions map DB rows to a clean response shape (DTO).
- **Server vs client boundaries** — the client grid calls the REST API; server components read the DB/session directly.
- **Auth** — bcrypt hashes, JWT sessions in an httpOnly cookie, route protection via `proxy.ts` (edge-safe config split), rate-limited endpoints.
- **Transactions** — checkout runs in a `prisma.$transaction`: server-side pricing, an **atomic conditional stock decrement** to prevent overselling under concurrency, and full rollback on any failure.
- **Authorization** — order history is scoped to the session's user id (users see only their own orders); orders fetched with a nested `include` (no N+1).
- **Reliability** — consistent error envelope + structured JSON logging.
- **Polyglot integration** — the FastAPI service is called cross-origin (CORS configured), with a `NEXT_PUBLIC_` env var and **graceful degradation** if the service is down.
- **Validated inputs** everywhere (Zod / Pydantic); **accessibility** (semantic roles, aria-labels, focus rings, Storybook a11y).

## Getting started

Requires a PostgreSQL database (e.g. a free [Neon](https://neon.tech) project) and Python 3.11+ for the recommendations service.

### 1. Next.js app

```bash
npm install

# .env
#   DATABASE_URL="postgresql://…"
#   AUTH_SECRET="…"                            # openssl rand -base64 33
#   NEXT_PUBLIC_RECOMMENDATIONS_API_URL="http://localhost:8000"

npx prisma migrate dev     # create tables
npm run db:seed            # seed products
npm run dev                # http://localhost:3000
```

### 2. FastAPI recommendations service

```bash
cd services/recommendations
python3.12 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# .env  ->  DATABASE_URL="postgresql://…"   (same Neon DB)

uvicorn main:app --reload --port 8000   # docs at http://localhost:8000/docs
```

## Scripts (Next.js)

| Command | Does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm test` | Run the Jest test suite |
| `npm run lint` | Lint with ESLint |
| `npm run db:seed` | Seed the database with products |
| `npm run storybook` | Launch Storybook at :6006 |

## Deployment

- **Frontend** → Vercel (production deploys gated behind CI passing).
- **Database** → Neon (Postgres).
- **Recommendations service** → Render (defined by `render.yaml`).

## Roadmap

- ~~Authentication & user accounts~~ ✅
- ~~Cart persistence and order checkout (DB transactions)~~ ✅
- ~~FastAPI recommendations microservice~~ ✅
- Caching, shared-store rate limiting, and a system-design write-up
- Stripe payment integration
