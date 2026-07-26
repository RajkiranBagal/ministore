// Simple in-memory, fixed-window rate limiter.
//
// NOTE: in-memory only works within a SINGLE server instance and resets on
// restart. Fine for dev/single-instance. For serverless/multi-instance
// production, swap for a shared store (e.g. Upstash Redis / @upstash/ratelimit).

type Entry = { count: number; resetAt: number };

const store = new Map<string, Entry>();

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const entry = store.get(key);

  // New window: first request, or the previous window has expired.
  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  entry.count += 1;
  const retryAfterSeconds = Math.ceil((entry.resetAt - now) / 1000);

  if (entry.count > limit) {
    return { ok: false, remaining: 0, retryAfterSeconds };
  }
  return { ok: true, remaining: limit - entry.count, retryAfterSeconds };
}

// Best-effort client IP from request headers (Vercel/proxies set x-forwarded-for).
export function clientIp(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  return xff?.split(",")[0]?.trim() || "unknown";
}
