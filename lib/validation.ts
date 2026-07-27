import { z } from "zod";

// URL query params arrive as strings (or missing). This schema coerces them
// to the right types, applies sane bounds, and fills defaults — so nothing
// unvalidated ever reaches the database query.
export const productQuerySchema = z.object({
  q: z.string().trim().optional(),
  category: z.string().trim().optional(),
  sort: z
    .enum(["price_asc", "price_desc", "rating", "newest"])
    .default("newest"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
});

// A TypeScript type inferred FROM the schema — one source of truth.
export type ProductQuery = z.infer<typeof productQuerySchema>;

export const signupSchema = z.object({
  email: z.email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().trim().min(1).optional(),
});

export const checkoutSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.number().int().positive(),
        quantity: z.number().int().positive(),
      })
    )
    .min(1, "Cart is empty"),
});
