// ─── Pothos schema builder ──────────────────────────────────────────────────
// Pothos is a CODE-FIRST GraphQL schema builder: you define types in TypeScript
// and it derives the SDL, rather than you writing SDL and keeping resolvers in
// sync by hand. The payoff is that the schema can't drift from the types.
//
// The Prisma plugin goes further — it reads our Prisma models and makes
// `builder.prismaObject("Product", …)` type-check against the real database
// schema. Rename a column and this file fails to compile.

import SchemaBuilder from "@pothos/core";
import PrismaPlugin from "@pothos/plugin-prisma";
import type PrismaTypes from "@/lib/generated/pothos";
import { getDatamodel } from "@/lib/generated/pothos";
import { prisma } from "@/lib/db";
import type { GraphQLContext } from "./context";

export const builder = new SchemaBuilder<{
  PrismaTypes: PrismaTypes;
  Context: GraphQLContext;
}>({
  plugins: [PrismaPlugin],
  prisma: {
    client: prisma,

    // REQUIRED ON PRISMA 7. Prisma 7 removed the DMMF (its internal model
    // metadata) from the client to shrink bundle size, so Pothos can no longer
    // read the datamodel off `prisma._dmmf` the way it used to. The
    // `prisma-pothos-types` generator emits it as a plain function instead —
    // that's what the extra generator in schema.prisma is for.
    //
    // Symptom if this is missing or stale: relations silently fail to resolve,
    // or Pothos throws about an unknown model at startup.
    dmmf: getDatamodel(),

    // Pothos can inspect the incoming GraphQL query and build a single Prisma
    // `include`/`select` covering every requested relation — the mechanism that
    // keeps this from reintroducing N+1. See the `related` field in schema.ts.
    filterConnectionTotalCount: true,
  },
});
