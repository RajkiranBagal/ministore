// ─── Input validation schemas ───────────────────────────────────────────────
// Every schema for untrusted input lives here, in one file, rather than beside
// each route. That makes it easy to audit "what does this app accept?" in a
// single read, and lets tests (validation.test.ts) cover the rules directly.
//
// The principle: NEVER trust input from a browser. Anyone can craft a request
// with curl — the form's `required` and `minLength` attributes are UX, and
// these schemas are the actual enforcement.
//
// All three are used with `.safeParse()`, which returns { success, data|error }
// instead of throwing, so handlers can return a clean 400 rather than a 500.

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

// Mirrored by the `minLength={8}` on the signup form — but THIS is the rule
// that counts, since the browser check is trivially bypassed. Keep them in sync.
// `.optional()` on name means the key may be absent entirely; combined with
// `.min(1)`, an empty string is rejected — which is why the signup page sends
// `undefined` rather than "" for a blank name.
export const signupSchema = z.object({
  email: z.email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().trim().min(1).optional(),
});

// Note what is NOT here: price. The client sends ids and quantities only, and
// the server looks up prices itself — accepting a price from the browser would
// let anyone buy anything for a penny.
//
// `.int().positive()` blocks the interesting attacks: a negative quantity would
// otherwise INCREMENT stock and reduce the order total, and a fractional one
// would corrupt the arithmetic. `.min(1)` rejects an empty cart.
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
