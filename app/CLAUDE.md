# app/ — Next.js 16 App Router

Route tree + root layout. Next 16.2.11, React 19.2.4. Path alias `@/*` → repo root.

## Files here

| File | What it is |
|---|---|
| `layout.tsx` | Root layout (Server). Geist fonts → CSS vars, wraps `<Providers>` (Redux) then `<Header/>`. Exports `metadata`. |
| `page.tsx` | `/` home (Server). Static shell + `<ProductGrid/>` client island. |
| `Header.tsx` | Not a route — colocated async Server Component. `await auth()` for session, renders `SignOutButton` or login/signup links, always `<CartWidget/>`. |
| `globals.css` | Tailwind v4 (`@import "tailwindcss"`), `@theme inline` tokens, `prefers-color-scheme: dark` block. |

## Route map

| Route | Dir | Kind |
|---|---|---|
| `/` | `app/` | Server shell + client grid |
| `/products/[id]` | `app/products/[id]/` | Server, direct DB read |
| `/login`, `/signup` | `app/login/`, `app/signup/` | `"use client"` forms |
| `/account`, `/account/orders` | `app/account/` | Server, session-gated |
| `/api/*` | `app/api/` | Route handlers — see `app/api/CLAUDE.md` |

## Conventions that apply to every file in this tree

- **Server shell + client island.** Pages stay Server Components; interactivity is pushed into `features/*` components marked `"use client"`. Don't add `"use client"` to a `page.tsx` unless the whole page is a form (`login`, `signup` are the only two).
- **Next 16 async params.** `params: Promise<{...}>` — always `await params`. Same for `searchParams`.
- **No `loading.tsx` / `error.tsx` / `not-found.tsx` / nested layouts exist anywhere.** Only the root layout. If you add one, it's a new pattern, not an existing one.
- **No route segment config** (`export const revalidate` / `dynamic`) is used anywhere. Caching is done in `lib/products.ts` via `unstable_cache` + tags, not per-segment.
- **Auth is layered**: `proxy.ts` (Next 16's renamed middleware, `matcher: ["/account/:path*"]`) → in-page `redirect("/login")` → in-handler `401`. Adding a protected page under `/account` inherits the proxy guard; anywhere else you must guard yourself.
- **Money is cents** (`priceCents`, `totalCents`, `unitPriceCents`) in the DB; convert to dollars only at the render/API boundary.
- Product images come from `cdn.dummyjson.com` — the only host allowed in `next.config.ts` `images.remotePatterns`.
