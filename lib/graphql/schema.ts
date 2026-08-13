// ─── GraphQL schema ─────────────────────────────────────────────────────────
// Deliberately mirrors the REST contract in app/api/products/route.ts rather
// than inventing a parallel one — same filters, same sorts, same exposed
// fields. That keeps the two comparable and makes this a genuine like-for-like
// experiment rather than a rewrite.
//
// READ-ONLY BY DESIGN. There are no mutations here: checkout and signup stay on
// REST because their per-route rate limits (checkout: 10/min, signup: 5/min)
// don't survive being collapsed onto one endpoint. See the note in route.ts.

import { builder } from "./builder";
import { prisma } from "@/lib/db";
import { Prisma } from "@/lib/generated/prisma/client";
import { logger } from "@/lib/logger";

// Sort options, identical to the `sort` enum in lib/validation.ts. Modelling
// this as a GraphQL enum rather than a String is what makes invalid values a
// query-validation error — rejected before a resolver ever runs, with no
// hand-written check.
const ProductSort = builder.enumType("ProductSort", {
  values: ["price_asc", "price_desc", "rating", "newest"] as const,
});

const orderByMap: Record<string, Prisma.ProductOrderByWithRelationInput> = {
  price_asc: { priceCents: "asc" },
  price_desc: { priceCents: "desc" },
  rating: { rating: "desc" },
  newest: { createdAt: "desc" },
};

// ─── Product ────────────────────────────────────────────────────────────────
// `prismaObject` binds this type to the Prisma model, so field names are
// checked against the real database schema at compile time.
//
// Note what is NOT exposed: `stock` and `createdAt`. Same discipline as the
// REST DTO — the database model and the public API are separate contracts, and
// a GraphQL schema is if anything easier to over-share through, since clients
// can ask for any field you declare.
const ProductType = builder.prismaObject("Product", {
  fields: (t) => ({
    id: t.exposeInt("id"),
    title: t.exposeString("title"),
    description: t.exposeString("description"),
    thumbnail: t.exposeString("thumbnail"),
    category: t.exposeString("category"),
    rating: t.exposeFloat("rating"),

    // Computed, not exposed directly: the column is `priceCents` (an integer),
    // and dollars are produced only at this boundary — same rule as everywhere
    // else in the app.
    price: t.float({
      resolve: (product) => product.priceCents / 100,
    }),

    // ── The composition field ─────────────────────────────────────────────
    // This is the one thing here REST couldn't do as neatly: a single query
    // returns a product plus its recommendations, where the recommendations
    // come from an entirely different service in a different language.
    //
    // Division of labour: the FastAPI service supplies the RANKING (it owns the
    // "top-rated in the same category" logic), and Postgres supplies the
    // product DATA. We deliberately re-read the rows from Prisma rather than
    // trusting the shapes the Python service returns, so there is exactly one
    // definition of what a Product looks like in this schema.
    //
    // Cost: one extra DB query per product that asks for `related` — NOT N+1,
    // because it's a single `findMany` with an `in` filter regardless of how
    // many recommendations come back.
    // Note the type is the STRING "Product", not the builder variable — a
    // self-referencing field can't name the very type it's being defined on
    // without TypeScript hitting a circular inference error. Pothos resolves
    // named types lazily, which sidesteps it.
    related: t.prismaField({
      type: ["Product"],
      description: "Recommended products, ranked by the recommendations service.",
      // `query` carries the nested selection set Pothos derived from the
      // incoming GraphQL query. Spreading it into findMany is what keeps
      // relations folded into one SQL statement instead of N+1.
      resolve: async (query, product) => {
        const apiBase = process.env.RECOMMENDATIONS_API_URL;
        if (!apiBase) return [];

        try {
          const res = await fetch(
            `${apiBase}/recommendations/${product.id}?limit=4`,
            // Don't let a sleeping free-tier service hang the whole query.
            { signal: AbortSignal.timeout(3000) }
          );
          if (!res.ok) throw new Error(`status ${res.status}`);

          const ranked: Array<{ id: number }> = await res.json();
          if (ranked.length === 0) return [];

          const ids = ranked.map((r) => r.id);
          const rows = await prisma.product.findMany({
            ...query,
            where: { id: { in: ids } },
          });

          // findMany returns rows in arbitrary order, so restore the service's
          // ranking — otherwise "recommended" silently becomes "by primary key".
          const byId = new Map(rows.map((r) => [r.id, r]));
          return ids
            .map((id) => byId.get(id))
            .filter((r): r is NonNullable<typeof r> => r !== undefined);
        } catch (err) {
          // Same graceful degradation as RelatedProducts.tsx: a second service
          // being down must never fail the product query. Return an empty list
          // and log it, rather than surfacing a GraphQL error to the client.
          logger.warn("graphql.related.failed", {
            productId: product.id,
            message: err instanceof Error ? err.message : String(err),
          });
          return [];
        }
      },
    }),
  }),
});

// Pagination metadata, matching the REST envelope exactly.
const PageInfo = builder
  .objectRef<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  }>("PageInfo")
  .implement({
    fields: (t) => ({
      page: t.exposeInt("page"),
      limit: t.exposeInt("limit"),
      total: t.exposeInt("total"),
      totalPages: t.exposeInt("totalPages"),
    }),
  });

const ProductPage = builder
  .objectRef<{
    products: unknown[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }>("ProductPage")
  .implement({
    fields: (t) => ({
      products: t.field({
        type: [ProductType],
        // The cast is needed because objectRef can't know these rows are the
        // Prisma model the ProductType is bound to; the query below guarantees it.
        resolve: (parent) => parent.products as never,
      }),
      pagination: t.field({
        type: PageInfo,
        resolve: (parent) => parent.pagination,
      }),
    }),
  });

// ─── Queries ────────────────────────────────────────────────────────────────
builder.queryType({
  fields: (t) => ({
    products: t.field({
      type: ProductPage,
      description: "Search, filter, sort and paginate the catalog.",
      args: {
        q: t.arg.string({ required: false }),
        category: t.arg.string({ required: false }),
        sort: t.arg({ type: ProductSort, required: false }),
        page: t.arg.int({ required: false, defaultValue: 1 }),
        limit: t.arg.int({ required: false, defaultValue: 12 }),
      },
      resolve: async (_parent, args) => {
        // GraphQL's type system validates TYPES but not RANGES, so the bounds
        // that lib/validation.ts enforces for REST still need enforcing here.
        // Clamping rather than erroring keeps this forgiving, and the cap is
        // what stops someone requesting 10,000 rows in one query.
        const page = Math.max(1, args.page ?? 1);
        const limit = Math.min(50, Math.max(1, args.limit ?? 12));
        const sort = args.sort ?? "newest";

        const q = args.q?.trim();
        const category = args.category?.trim();
        const where: Prisma.ProductWhereInput = {
          ...(q && { title: { contains: q, mode: "insensitive" } }),
          ...(category && { category }),
        };

        const [total, products] = await Promise.all([
          prisma.product.count({ where }),
          prisma.product.findMany({
            where,
            orderBy: orderByMap[sort],
            skip: (page - 1) * limit,
            take: limit,
          }),
        ]);

        return {
          products,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        };
      },
    }),

    // prismaField (rather than plain field) gives the resolver a `query` object
    // built from the request's selection set — the plugin's mechanism for
    // fetching exactly what was asked for in one round-trip.
    product: t.prismaField({
      type: "Product",
      nullable: true,
      description: "A single product by id, or null if it doesn't exist.",
      args: { id: t.arg.int({ required: true }) },
      resolve: async (query, _parent, args) =>
        prisma.product.findUnique({ ...query, where: { id: args.id } }),
    }),
  }),
});

export const schema = builder.toSchema();
