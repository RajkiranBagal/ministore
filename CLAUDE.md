@AGENTS.md

# MiniStore

Polyglot e-commerce storefront. Next.js 16 App Router + React 19 on Vercel, Neon Postgres via Prisma 7, plus a FastAPI recommendations service on Render reading the same DB.

Deeper docs live in per-folder `CLAUDE.md` files — they load automatically when you open files in that folder, so **don't preload them**. `README.md` (setup, tech-stack rationale) and `SYSTEM_DESIGN.md` (scaling analysis, deferred trade-offs) cover the narrative.

## Where things are

| Path | What | Detail |
|---|---|---|
| `app/` | routes + root layout | `app/CLAUDE.md` |
| `app/api/` | 4 route handlers | `app/api/CLAUDE.md` |
| `features/` | `"use client"` domain UI (cart, products, auth) | `features/CLAUDE.md` |
| `components/` | generic Redux-free UI | `components/CLAUDE.md` |
| `lib/` | server utils + data access | `lib/CLAUDE.md` |
| `store/` | Redux Toolkit — **not zustand** | `store/CLAUDE.md` |
| `prisma/` | schema, migrations, seed | `prisma/CLAUDE.md` |
| `services/recommendations/` | Python FastAPI | its `CLAUDE.md` |

Root files: `auth.ts` (Credentials provider, bcrypt) / `auth.config.ts` (**must stay edge-safe — no Prisma, no bcrypt**) / `proxy.ts` (Next 16's renamed middleware, guards `/account/:path*`).

## Commands

```bash
npm run dev          # next dev
npm test             # Jest — the only suite CI runs
npm run lint         # eslint (no typecheck script; next build catches types)
npm run build
npm run db:seed      # tsx prisma/seed.ts — wipes + reseeds products
npm run storybook    # :6006
```

## Conventions that bite if you miss them

- **Money is integer cents** in the DB (`priceCents`, `totalCents`, `unitPriceCents`); convert to dollars only at the API/render boundary.
- **Prisma client is generated to `lib/generated/prisma/`** (gitignored, custom output dir). Import from `@/lib/generated/prisma/client`, never `@prisma/client`.
- **`prisma.config.ts` injects `DATABASE_URL`** — `schema.prisma` has no `url` in its datasource block.
- **Server shell + client island.** Pages stay Server Components; interactivity goes in `features/*`. Server Components read the DB directly (`lib/products.ts`, `lib/orders.ts`); `/api/*` exists for the browser.
- **Next 16 async params**: `params: Promise<{...}>`, always `await`.
- **Handler order: auth → rate limit → validate → work.** Zod schemas all live in `lib/validation.ts` and use `safeParse` + `error.flatten()` into a `details` field; errors go through `errorResponse()` from `lib/api-response.ts`.
- **Authorization belongs in the query** (`where: { userId }`), not a post-fetch filter.
- **Single import alias `@/*` → repo root.** Cross-folder imports use it; same-folder stays relative. No barrel `index.ts` files anywhere — import full paths.
- **No `loading.tsx` / `error.tsx` / `not-found.tsx` / nested layouts and no route segment config exist.** Caching is `unstable_cache` + `revalidateTag("products", "max")`, not per-segment exports.
- Tests are colocated, Jest only (`*.test.ts` for logic, `*.test.tsx` for components). The Vitest config serves Storybook and is not wired to any script.

## Known gaps (documented, not bugs to "fix" incidentally)

- `lib/rate-limit.ts` is an in-memory `Map` — single-instance only, useless across serverless instances. Redis is the intended fix.
- `app/api/orders/route.ts` collapses every failure to **409 with the raw `Error.message`** echoed to the client.
- `app/api/auth/register/route.ts` hand-rolls `NextResponse.json` instead of using `errorResponse()`.
- Cart is memory-only — no persistence. Orders stay `status: "pending"`; there's no payment integration.
- Search is `ILIKE '%q%'`; no CSP header yet.

`.agents/`, `.claude/skills/`, `.windsurf/skills/` and `skills-lock.json` are gitignored vendored Prisma skill packages — ignore them.
