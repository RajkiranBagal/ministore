// ─── Rate limiting ──────────────────────────────────────────────────────────
// Simple in-memory, fixed-window rate limiter.
//
// NOTE: in-memory only works within a SINGLE server instance and resets on
// restart. Fine for dev/single-instance. For serverless/multi-instance
// production, swap for a shared store (e.g. Upstash Redis / @upstash/ratelimit).
//
// Take that limitation seriously — on Vercel, each concurrent function instance
// gets its OWN Map, so a limit of "5 per minute" is really "5 per minute per
// instance". It raises the cost of an attack without preventing one. The shape
// of this API deliberately matches @upstash/ratelimit so swapping it later is a
// small change confined to this file.
//
// "Fixed window" is the simplest algorithm and has a known flaw: a burst at
// 0:59 and another at 1:01 fits 2× the limit into two seconds. Sliding-window
// and token-bucket algorithms fix that; not worth the complexity here.
//
// Used by: signup (5/min), checkout (10/min), login (10/min, in auth.ts).

type Entry = { count: number; resetAt: number };

// Module-level state — created once per process and shared by every request
// that instance handles. This is exactly why it doesn't work across instances.
const store = new Map<string, Entry>();

export type RateLimitResult = {
  ok: boolean; // false = reject the request
  remaining: number; // requests left in this window
  retryAfterSeconds: number; // for the Retry-After header on a 429
};

// `key` namespaces the counter, by convention "<action>:<ip>" — so a user's
// login attempts and checkout attempts are counted separately rather than
// sharing one budget.
//
// A note on the limitation of keying by IP: everyone behind one office NAT or
// mobile carrier shares a counter, while an attacker with a proxy pool gets a
// fresh budget per address. Keying by user id (where you have one) or by
// account+IP together is the usual refinement.
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

  // Existing window: count this request. Note the counter keeps climbing past
  // the limit — harmless here, and it means the numbers would be usable if you
  // ever wanted to log repeat offenders.
  entry.count += 1;
  const retryAfterSeconds = Math.ceil((entry.resetAt - now) / 1000);

  if (entry.count > limit) {
    return { ok: false, remaining: 0, retryAfterSeconds };
  }
  return { ok: true, remaining: limit - entry.count, retryAfterSeconds };
}

// ⚠️  Entries are never deleted — an expired window is only overwritten if that
// same key comes back. A long-running server accumulates one entry per unique
// IP seen. Tolerable for a demo (serverless instances are recycled anyway), but
// it's an unbounded-growth leak worth knowing about. A real fix would sweep
// expired keys periodically, or let Redis expire them for you.

// Best-effort client IP from request headers (Vercel/proxies set x-forwarded-for).
//
// "Best-effort" is doing real work in that sentence. x-forwarded-for is just a
// header, and a client can send whatever it likes — the value is only
// trustworthy because Vercel's proxy overwrites it. Behind a chain of proxies
// the header is a comma-separated list, oldest first, so the first entry is the
// original client. Never trust this for anything security-critical (like
// authorization); throttling is about the right level of consequence for it.
export function clientIp(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  // `|| "unknown"` means all unidentifiable callers share one bucket — a
  // deliberately conservative default: fail closed, not open.
  return xff?.split(",")[0]?.trim() || "unknown";
}
