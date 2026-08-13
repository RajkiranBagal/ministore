// ─── Rate limiter tests ─────────────────────────────────────────────────────
// Two techniques worth learning here.
//
// 1. UNIQUE KEYS PER TEST. The limiter's store is a module-level Map shared
//    across the whole test file, so reusing a key would leak state between
//    tests and make them order-dependent. A distinct key per test isolates them.
//
// 2. FAKE TIMERS (below). Testing "the window expires after 60 seconds" without
//    them would mean actually waiting 60 seconds.

import { rateLimit } from "./rate-limit";

describe("rateLimit", () => {
  test("allows requests up to the limit, then blocks", () => {
    const key = "test-allow-then-block";
    // 3 allowed…
    expect(rateLimit(key, 3, 60_000).ok).toBe(true);
    expect(rateLimit(key, 3, 60_000).ok).toBe(true);
    expect(rateLimit(key, 3, 60_000).ok).toBe(true);
    // …4th blocked.
    expect(rateLimit(key, 3, 60_000).ok).toBe(false);
  });

  test("reports remaining count", () => {
    const key = "test-remaining";
    expect(rateLimit(key, 5, 60_000).remaining).toBe(4);
    expect(rateLimit(key, 5, 60_000).remaining).toBe(3);
  });

  test("resets after the window expires", () => {
    // Fake timers replace the global clock — including Date.now(), which is
    // what the limiter reads — so we can jump forward instantly. Without this
    // the test would need a real 1-second sleep, and slow tests get skipped.
    jest.useFakeTimers();
    const key = "test-reset";
    expect(rateLimit(key, 1, 1000).ok).toBe(true);
    expect(rateLimit(key, 1, 1000).ok).toBe(false); // blocked within window
    jest.advanceTimersByTime(1100); // window passes
    expect(rateLimit(key, 1, 1000).ok).toBe(true); // allowed again
    // ALWAYS restore. Fake timers are global state; leaving them installed
    // would break unrelated tests that run after this one in the same file.
    jest.useRealTimers();
  });

  test("keys are independent", () => {
    expect(rateLimit("key-a", 1, 60_000).ok).toBe(true);
    expect(rateLimit("key-a", 1, 60_000).ok).toBe(false);
    // A different key has its own bucket.
    expect(rateLimit("key-b", 1, 60_000).ok).toBe(true);
  });
});
