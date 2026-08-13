# prisma/ — Schema, migrations, seed

Postgres (Neon in production). Prisma 7 with the `PrismaPg` driver adapter.

## Config gotcha

`schema.prisma` has **no `url` in the `datasource` block**. The connection string is injected by `prisma.config.ts` at the repo root (`datasource.url = process.env["DATABASE_URL"]`, `schema: "prisma/schema.prisma"`, `migrations.path: "prisma/migrations"`, with `import "dotenv/config"`). If Prisma CLI commands can't find a database, look there, not here.

Generator output is `../lib/generated/prisma` (custom dir, gitignored) — so import types from `@/lib/generated/prisma/client`, not `@prisma/client`.

## Models

| Model | Key fields | Indexes |
|---|---|---|
| `Product` | `id Int @id @default(autoincrement())`, `title`, `description`, `priceCents Int`, `stock Int @default(0)`, `category`, `thumbnail`, `rating Float @default(0)`, `createdAt` | `@@index([category, rating])`, `@@index([title])` |
| `User` | `id String @id @default(cuid())`, `email @unique`, `passwordHash`, `name String?`, `createdAt` | — |
| `Order` | `id String @id @default(cuid())`, `userId → User`, `status String @default("pending")`, `totalCents Int`, `createdAt` | `@@index([userId])` |
| `OrderItem` | `id String @id @default(cuid())`, `orderId → Order`, `productId Int → Product`, `quantity`, `unitPriceCents` | `@@index([orderId])`, `@@index([productId])` |

No enums (`enums.ts` in the generated client is an empty barrel).

**Design rationale:** money is always integer cents (never floats). `cuid()` string IDs on user-facing rows avoid enumeration; `Product` keeps a serial int because it's public catalog data. `unitPriceCents` on `OrderItem` snapshots the price at purchase time so later price changes don't rewrite history. All FKs are `ON DELETE RESTRICT ON UPDATE CASCADE`.

## Seed

`seed.ts`, run with `npm run db:seed` (via `tsx`). Builds its **own** `PrismaClient` + `PrismaPg` adapter rather than importing `lib/db.ts`. Fetches `https://dummyjson.com/products?limit=100`, `deleteMany()` first for idempotency, then `createMany` converting dollars → `Math.round(price * 100)` cents.

## Workflow

```bash
npx prisma migrate dev --name <change>   # schema change + migration
npm run db:seed                          # reset + repopulate products
npx prisma generate                      # also runs on postinstall
```
