// ─── GET /api/products — catalog search ─────────────────────────────────────
// Public, unauthenticated, read-only. Powers the search box on the home page
// (see features/products/ProductGrid.tsx → lib/api.ts).
//
// Why this exists at all, when Server Components can query the DB directly:
// the product grid searches as you TYPE, from the browser, after the page has
// loaded. That needs an HTTP endpoint. Server-rendered pages like
// /products/[id] skip this and hit the database directly — that's the rule of
// thumb, API for the browser, direct queries for the server.

import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/db";
import { productQuerySchema } from "@/lib/validation";

// Exporting a function named GET is what makes this file respond to HTTP GET.
// POST/PUT/DELETE would each be their own named export in the same file.
export async function GET(request: NextRequest) {
  // ── 1. Validate query params ──────────────────────────────────────────────
  // Query strings are ALWAYS strings ("?page=2" gives you "2", not 2), and any
  // of them can be missing or hostile. The schema coerces types, clamps `limit`
  // to 50 so nobody can request 10,000 rows, and fills defaults. safeParse
  // returns a result object instead of throwing.
  const rawParams = Object.fromEntries(request.nextUrl.searchParams);
  const parsed = productQuerySchema.safeParse(rawParams);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query parameters", details: parsed.error.flatten() },
      { status: 400 } // Bad Request — the client sent something invalid
    );
  }

  // Everything below this line is validated and correctly typed.
  const { q, category, sort, page, limit } = parsed.data;

  // ── 2. Build the filter ───────────────────────────────────────────────────
  // The `...(cond && {…})` trick conditionally includes a key: when `q` is
  // undefined the spread contributes nothing, so we don't accidentally send
  // `{ title: undefined }` and filter on nothing. Typing it as
  // Prisma.ProductWhereInput means a typo in a field name fails to compile.
  //
  // `contains` compiles to SQL ILIKE '%q%'. Note a leading-wildcard LIKE cannot
  // use a B-tree index, so this scans — fine at 100 products, and the noted
  // upgrade path is a Postgres tsvector full-text index.
  const where: Prisma.ProductWhereInput = {
    ...(q && { title: { contains: q, mode: "insensitive" } }),
    ...(category && { category }),
  };

  // A lookup object beats a switch here: because `sort` is a Zod enum, the
  // Record<typeof sort, …> type forces this map to cover every allowed value —
  // add a sort option to the schema and TypeScript demands you handle it.
  // It also keeps user input away from the query: the string selects a
  // predefined clause, it never becomes one.
  const orderByMap: Record<
    typeof sort,
    Prisma.ProductOrderByWithRelationInput
  > = {
    price_asc: { priceCents: "asc" },
    price_desc: { priceCents: "desc" },
    rating: { rating: "desc" },
    newest: { createdAt: "desc" },
  };

  // ── 3. Count + fetch, in parallel ─────────────────────────────────────────
  // Pagination needs the total row count as well as the page itself. These two
  // queries don't depend on each other, so Promise.all runs them concurrently —
  // awaiting them in sequence would roughly double the latency.
  const [total, rows] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy: orderByMap[sort],
      // Offset pagination: skip the pages before this one. Simple and fine
      // here; note that at very large offsets Postgres still walks the skipped
      // rows, which is when people switch to cursor pagination.
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  // ── 4. Map DB rows → API shape ────────────────────────────────────────────
  // Deliberately NOT `return rows`. The database model and the public API are
  // separate contracts: we convert cents → dollars, and drop `stock` and
  // `createdAt`, which are internal. Returning rows directly means every future
  // column you add leaks automatically — including ones you didn't mean to
  // publish. Type this shape once and the client knows what it gets.
  const products = rows.map((p) => ({
    id: p.id,
    title: p.title,
    description: p.description,
    price: p.priceCents / 100,
    thumbnail: p.thumbnail,
    category: p.category,
    rating: p.rating,
  }));

  return NextResponse.json({
    products,
    // Returning pagination metadata lets the client render "page 2 of 9"
    // without having to guess or count.
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}
