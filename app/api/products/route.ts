import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/db";
import { productQuerySchema } from "@/lib/validation";

// A GET handler for /api/products. Exporting a function named GET makes this
// respond to HTTP GET requests (POST/PUT/DELETE would be their own exports).
export async function GET(request: NextRequest) {
  // 1. Validate query params. safeParse never throws — it returns success/error.
  const rawParams = Object.fromEntries(request.nextUrl.searchParams);
  const parsed = productQuerySchema.safeParse(rawParams);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query parameters", details: parsed.error.flatten() },
      { status: 400 } // Bad Request — the client sent something invalid
    );
  }

  const { q, category, sort, page, limit } = parsed.data;

  // 2. Build the DB filter from validated input (only add clauses that apply).
  const where: Prisma.ProductWhereInput = {
    ...(q && { title: { contains: q, mode: "insensitive" } }),
    ...(category && { category }),
  };

  const orderByMap: Record<
    typeof sort,
    Prisma.ProductOrderByWithRelationInput
  > = {
    price_asc: { priceCents: "asc" },
    price_desc: { priceCents: "desc" },
    rating: { rating: "desc" },
    newest: { createdAt: "desc" },
  };

  // 3. Count (for pagination) and fetch the page — in parallel.
  const [total, rows] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy: orderByMap[sort],
      skip: (page - 1) * limit, // offset pagination
      take: limit,
    }),
  ]);

  // 4. Map DB rows → API shape (priceCents → dollars, drop internal fields).
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
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}
