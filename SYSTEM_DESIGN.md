# MiniStore — System Design

A concise design overview of MiniStore: what the system is, how the pieces fit, the key decisions, and how it would scale.

## 1. Overview

MiniStore is a **full-stack, polyglot** e-commerce app:

- **Frontend + primary backend** — Next.js (App Router) on **Vercel**: product catalog, auth, cart, and orders.
- **Recommendations** — a **Python FastAPI** microservice on **Render**.
- **Database** — **PostgreSQL** on **Neon**, shared by both services.

```
                       ┌──────────────────────────────┐
   Browser  ─────────► │  Next.js frontend (Vercel)   │
                       │  React Server/Client Components│
                       └───────┬───────────────┬──────┘
       Next Route Handlers +   │               │  cross-origin fetch
       Server Components        │               │  (recommendations)
                                ▼               ▼
                     ┌────────────────┐   ┌───────────────────────────┐
                     │ PostgreSQL     │◄──┤ FastAPI service (Render)   │
                     │ (Neon)         │   │ Python · psycopg           │
                     └────────────────┘   └───────────────────────────┘
```

## 2. Components & responsibilities

| Component | Responsibility | Notes |
| --- | --- | --- |
| Next.js app | UI, products API, auth, cart, checkout/orders | Route Handlers + Server Components; Prisma ORM |
| FastAPI service | Product recommendations | Own deploy; reads the same Postgres |
| PostgreSQL (Neon) | System of record | Products, Users, Orders, OrderItems |
| Vercel / Render | Hosting | Frontend gated behind CI; service deployed via `render.yaml` |

## 3. Data model

`Product`, `User`, `Order`, `OrderItem` — money stored as **integer cents**; user-facing records (`User`/`Order`) use non-sequential `cuid` IDs to avoid enumeration. Indexes on foreign keys and on the columns we filter/sort by (e.g. a composite `(category, rating)`).

## 4. Key decisions

- **Server vs client boundaries** — the browser talks to the app's own API (it can't touch the DB); Server Components query the DB directly (no HTTP hop).
- **Transactions** — checkout runs in a DB transaction with **server-side pricing** and an **atomic conditional stock decrement** (prevents overselling under concurrency); rolls back fully on failure.
- **Auth** — Auth.js credentials + bcrypt hashes + JWT sessions in an httpOnly cookie; route protection via `proxy.ts`.
- **Caching** — product reads cached (data cache, tagged) and invalidated on the mutation that changes them (checkout → stock change).
- **Validation & safety** — Zod (Next) / Pydantic (FastAPI) at every boundary; rate limiting on auth + checkout; security headers; structured JSON logging; env validation at startup.

## 5. Scaling — where bottlenecks appear and how to address them

Roughly in the order they'd bite as traffic grows:

1. **Database connections** (serverless) — many function invocations open many connections. **Mitigation:** Neon's pooled endpoint for the runtime (direct endpoint only for migrations); or Neon's serverless driver adapter.
2. **Repeated read load** — the same products fetched constantly. **Mitigation:** the data cache we added; a CDN for static assets/images (already via Vercel + `next/image`); Redis for hot data if needed.
3. **Rate limiting at scale** — the current limiter is in-memory (per instance). **Mitigation:** a shared store (Upstash Redis / `@upstash/ratelimit`) so limits hold across instances.
4. **Search** — `WHERE title ILIKE '%q%'` doesn't scale. **Mitigation:** Postgres full-text search (`tsvector`), then a dedicated search engine (Algolia / Elasticsearch) at large catalog sizes.
5. **Write/throughput on the DB** — a single primary. **Mitigation:** read replicas for read-heavy traffic; partitioning/sharding much later.
6. **Slow or side-effecting work in the request path** (emails, webhooks). **Mitigation:** move to a background queue (eventual consistency).
7. **Observability** — as complexity grows, structured logs feed a log aggregator; add metrics + tracing (e.g. OpenTelemetry) to find bottlenecks.

## 6. Caching layers (top to bottom)

- **CDN** (Vercel edge) — static assets, optimized images.
- **App data cache** (Next `unstable_cache` / `use cache`) — cached DB reads, tag-invalidated on mutation.
- **Database** — indexes + the query planner.

Each layer absorbs load so fewer requests reach the layer below.

## 7. Trade-offs & what's intentionally deferred

- **Polyglot cost** — a separate FastAPI service adds deploy/ops overhead; justified here to demonstrate service integration, and because recommendations can scale/fail independently of checkout.
- **In-memory rate limiting** — fine for a single instance/demo; a shared store is the production upgrade.
- **No payment processing yet** — orders are `pending`; Stripe integration is the next milestone.
- **CSP** — baseline security headers are set; a strict Content-Security-Policy is a valuable hardening follow-up.
