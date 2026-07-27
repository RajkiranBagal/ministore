-- DropIndex
DROP INDEX "Product_category_idx";

-- CreateIndex
CREATE INDEX "Product_category_rating_idx" ON "Product"("category", "rating");
