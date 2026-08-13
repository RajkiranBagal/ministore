# app/api/orders/ — POST /api/orders

Checkout. Single file: `route.ts`, `export async function POST(request: Request)`.

## Contract

Request — `checkoutSchema` (`@/lib/validation`):
```json
{ "items": [{ "productId": 1, "quantity": 2 }] }
```
`productId`/`quantity` are positive ints; `items` needs ≥ 1 entry.

| Status | Body | When |
|---|---|---|
| 201 | `{ id, totalCents, status }` | success |
| 400 | `{ error: "Invalid cart", details }` | zod failure |
| 401 | `{ error: "Not authenticated" }` | no session |
| 409 | `{ error: "<Error.message>" }` | product missing, insufficient stock, or any DB throw |
| 429 | rate-limit message | > 10 requests/60s per IP |

## Implementation notes

- Sequence: `await auth()` → `rateLimit("checkout:"+ip, 10, 60_000)` → `checkoutSchema.safeParse` → `prisma.$transaction`.
- **The oversell guard is the important part.** Inside the transaction, per item: `findUnique` for price/title, then a *conditional* `updateMany({ where: { id, stock: { gte: quantity } }, data: { stock: { decrement: quantity } } })`. If `updated.count === 0`, stock was taken by a concurrent order → throw. Never read-then-write stock; the `where` clause is what makes it atomic.
- Prices are re-read from the DB, never trusted from the request body.
- Creates `Order` with nested `items` (`unitPriceCents` snapshotted at purchase time).
- Emits `logger.info("order.created", …)` / `logger.error("order.failed", …)` and `revalidateTag("products", "max")` so cached product reads pick up new stock.

## Known rough edges

Every failure collapses to **409 with the raw `Error.message` echoed to the client** — a DB error and an out-of-stock error are indistinguishable, and internal messages leak. Worth splitting if you touch this handler.
