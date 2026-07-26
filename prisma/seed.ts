import "dotenv/config";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Standalone script (not part of the Next app), so it makes its own client.
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// The shape of the fields we use from the DummyJSON response.
type DummyProduct = {
  title: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  thumbnail: string;
  rating: number;
};

async function main() {
  console.log("Fetching products from DummyJSON…");
  const res = await fetch("https://dummyjson.com/products?limit=100");
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
  const { products } = (await res.json()) as { products: DummyProduct[] };

  // Wipe first so re-running the seed is idempotent (no duplicates).
  console.log("Clearing existing products…");
  await prisma.product.deleteMany();

  console.log(`Inserting ${products.length} products…`);
  await prisma.product.createMany({
    data: products.map((p) => ({
      title: p.title,
      description: p.description,
      priceCents: Math.round(p.price * 100), // dollars → integer cents
      stock: p.stock,
      category: p.category,
      thumbnail: p.thumbnail,
      rating: p.rating,
    })),
  });

  const count = await prisma.product.count();
  console.log(`✅ Seed complete — Product table now has ${count} rows.`);
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
