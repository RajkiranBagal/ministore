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
    jest.useFakeTimers();
    const key = "test-reset";
    expect(rateLimit(key, 1, 1000).ok).toBe(true);
    expect(rateLimit(key, 1, 1000).ok).toBe(false); // blocked within window
    jest.advanceTimersByTime(1100); // window passes
    expect(rateLimit(key, 1, 1000).ok).toBe(true); // allowed again
    jest.useRealTimers();
  });

  test("keys are independent", () => {
    expect(rateLimit("key-a", 1, 60_000).ok).toBe(true);
    expect(rateLimit("key-a", 1, 60_000).ok).toBe(false);
    // A different key has its own bucket.
    expect(rateLimit("key-b", 1, 60_000).ok).toBe(true);
  });
});
