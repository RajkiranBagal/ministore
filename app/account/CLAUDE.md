# app/account/ — Signed-in area

Everything under `/account/*` is gated by `proxy.ts` (`matcher: ["/account/:path*"]`), so a request never reaches these pages without a JWT cookie.

| File | Route | Notes |
|---|---|---|
| `page.tsx` | `/account` | Async Server Component. `await auth()`, prints `session.user.name/email/id`, links to `/account/orders`. **No in-page guard** — renders `"—"`/undefined if somehow reached unauthenticated; it trusts the proxy entirely. |
| `orders/page.tsx` | `/account/orders` | Async Server Component. Has a belt-and-suspenders guard: `if (!session?.user?.id) redirect("/login")`. |

## Order history pattern

`orders/page.tsx` calls `getUserOrders(session.user.id)` from `@/lib/orders`. **Authorization is the query, not a filter** — `where: { userId }` scopes rows in the database rather than fetching all orders and filtering in JS. Keep it that way for any new user-scoped page.

The query uses a nested `include` (order → items → product `title`/`thumbnail`) to avoid N+1. Rendering converts `totalCents`/`unitPriceCents` to dollars, uses `next/image` for thumbnails, and has an explicit empty state.
