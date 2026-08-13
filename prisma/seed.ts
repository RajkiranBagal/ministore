// ─── Database seed ──────────────────────────────────────────────────────────
// Populates the Product table with 100 real-looking products from the public
// DummyJSON API, so the storefront has something to show. Run with:
//
//     npm run db:seed        (→ tsx prisma/seed.ts)
//
// `tsx` executes TypeScript directly, no build step. Note this script is NOT
// part of the Next app — it's a standalone Node program.

import "dotenv/config"; // load .env; Next does this automatically, plain Node does not
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Standalone script (not part of the Next app), so it makes its own client.
// It deliberately does NOT import lib/db.ts: that module uses the `@/` path
// alias (which Next resolves, plain tsx doesn't) and applies the hot-reload
// singleton logic, which is meaningless for a one-shot script.
//
// The `!` on DATABASE_URL asserts it's defined. Acceptable in a script you run
// by hand — it'll fail loudly and immediately — where lib/env.ts validates
// properly for the long-running app.
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// The shape of the fields we use from the DummyJSON response.
// Their API returns ~22 fields per product; typing only these seven documents
// what we actually depend on, and TypeScript checks our usage against it.
type DummyProduct = {
  title: string;
  description: string;
  price: number; // dollars, as a float — converted to cents below
  stock: number;
  category: string;
  thumbnail: string;
  rating: number;
};

async function main() {
  console.log("Fetching products from DummyJSON…");
  const res = await fetch("https://dummyjson.com/products?limit=100");
  // fetch doesn't reject on a 404/500, so check the status explicitly.
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
  // `as` is an assertion, not a validation — we're trusting the API's shape.
  // Fine for a seed script; untrusted input would need a Zod schema.
  const { products } = (await res.json()) as { products: DummyProduct[] };

  // Wipe first so re-running the seed is idempotent (no duplicates).
  //
  // ⚠️  deleteMany() with no argument deletes EVERY product. That's intended
  // here, but it also means this script is destructive — never point it at a
  // production database. It will also fail if any OrderItem references a
  // product, because the foreign key is ON DELETE RESTRICT.
  console.log("Clearing existing products…");
  await prisma.product.deleteMany();

  console.log(`Inserting ${products.length} products…`);
  // createMany sends ONE bulk INSERT instead of 100 separate round-trips.
  await prisma.product.createMany({
    data: products.map((p) => ({
      title: p.title,
      description: p.description,
      // Math.round, not Math.floor: 19.99 * 100 is 1998.9999… in floating
      // point, which floor would turn into 1998 — a penny lost per product.
      priceCents: Math.round(p.price * 100), // dollars → integer cents
      stock: p.stock,
      category: p.category,
      thumbnail: p.thumbnail,
      rating: p.rating,
    })),
  });

  // Read back a count as a cheap confirmation that the write landed.
  const count = await prisma.product.count();
  console.log(`✅ Seed complete — Product table now has ${count} rows.`);
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    // A non-zero exit code is what tells a shell or CI that this failed.
    // Without it the script would report success after an error.
    process.exit(1);
  })
  // `finally` runs on both paths, so the connection closes either way —
  // otherwise the Node process would hang with the pool still open.
  .finally(() => prisma.$disconnect());
