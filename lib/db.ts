// ─── Prisma client singleton ────────────────────────────────────────────────
// SERVER-ONLY. Importing this into a "use client" component breaks the build —
// which is a feature, not a bug: it stops database credentials and query code
// from ever reaching a browser bundle.
//
// Note the import path: `@/lib/generated/prisma/client`, NOT `@prisma/client`.
// This project sets a custom `output` in schema.prisma, so the generated client
// lands inside the repo. Import from the wrong path and you get a client that
// doesn't know about our models.

import { PrismaClient } from "@/lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { env } from "@/lib/env";

// The driver adapter tells Prisma HOW to reach Postgres via the `pg` driver,
// using our VALIDATED connection string (see lib/env.ts). Prisma 7's client
// has no built-in engine, so the connection is provided explicitly here.
const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });

// ── The dev-mode singleton dance ────────────────────────────────────────────
// In development, Next's hot reload re-executes this module on every file save.
// A plain `new PrismaClient()` would therefore create a NEW client — and a new
// connection pool — on each save, until Postgres refuses further connections.
//
// The fix: stash the instance on `globalThis`, which survives hot reloads
// because it isn't part of the module registry. The cast is needed because
// TypeScript's globalThis has no `prisma` property.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Reuse the existing client if one is already there, otherwise create it.
export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

// Only cache in development. In production the module is evaluated once, so
// there's nothing to guard against — and leaking a client onto the global
// object in a serverless environment is a habit worth not forming.
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
