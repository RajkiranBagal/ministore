import { PrismaClient } from "@/lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Validate the env var up front — a clear error beats a cryptic driver crash.
// (Proper env validation gets formalized on Day 4; this is the seed of it.)
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

// The driver adapter tells Prisma HOW to reach Postgres: via the `pg` driver
// using our connection string. Prisma 7's client has no built-in engine, so
// the connection is provided explicitly here.
const adapter = new PrismaPg({ connectionString });

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
