// ─── Environment validation ─────────────────────────────────────────────────
// Importing this module RUNS the check — there's no init() to call. Because
// lib/db.ts imports it, anything touching the database validates the
// environment first, automatically.
//
// The idea is "fail fast, fail loud": a missing DATABASE_URL should crash the
// process at boot with a clear message, not surface as a confusing undefined
// three layers deep in a request handler at 2am.

import { z } from "zod";

// Validate required environment variables once, at startup — fail fast with a
// clear message instead of a cryptic error deep inside a request.
//
// Note: AUTH_SECRET is validated by Auth.js at runtime (and isn't needed at
// build time), and NEXT_PUBLIC_RECOMMENDATIONS_API_URL is optional (graceful
// fallback), so the one hard requirement everywhere is DATABASE_URL.
const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  throw new Error(
    "Invalid environment variables: " +
      JSON.stringify(parsed.error.flatten().fieldErrors)
  );
}

// `parsed.data` is typed { DATABASE_URL: string } — not `string | undefined`
// like process.env.DATABASE_URL. So consumers get a guaranteed-present value
// and never need a `!` or a fallback.
export const env = parsed.data;
