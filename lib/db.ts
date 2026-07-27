import { PrismaClient } from "@/lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { env } from "@/lib/env";

// The driver adapter tells Prisma HOW to reach Postgres via the `pg` driver,
// using our VALIDATED connection string (see lib/env.ts). Prisma 7's client
// has no built-in engine, so the connection is provided explicitly here.
const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
