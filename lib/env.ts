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

export const env = parsed.data;
