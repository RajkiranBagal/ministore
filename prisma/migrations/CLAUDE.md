# prisma/migrations/

Applied SQL migrations. **Never edit a committed migration** — add a new one with `npx prisma migrate dev --name <change>`.

`migration_lock.toml` pins `provider = "postgresql"`.

| Migration | What it did |
|---|---|
| `20260726113001_init` | Creates all four tables — `Product` (`SERIAL` pk), `User`/`Order`/`OrderItem` (`TEXT` cuid pks) — plus `Product_category_idx`, `Product_title_idx`, unique `User_email_key`, `Order_userId_idx`, `OrderItem_orderId_idx`, `OrderItem_productId_idx`, and three FKs, all `ON DELETE RESTRICT ON UPDATE CASCADE`. |
| `20260727150118_product_category_rating_index` | Drops `Product_category_idx`, creates composite `Product_category_rating_idx ON "Product"("category","rating")`. The composite serves category filtering by left-prefix *and* the recommendations service's "top-rated within category" query, so the single-column index was redundant. |
