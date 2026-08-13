# app/account/orders/

`/account/orders` — one file, `page.tsx`, async Server Component.

`redirect("/login")` if no `session.user.id`, then `getUserOrders(userId)` from `@/lib/orders`. Authorization lives in the Prisma `where: { userId }`, not in post-fetch filtering. Nested `include` pulls items + product title/thumbnail in one query.

Context: `../CLAUDE.md`.
