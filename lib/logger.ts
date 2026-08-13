// ─── Structured logging ─────────────────────────────────────────────────────
// A deliberately tiny wrapper over console. No dependency, ~20 lines, and it
// buys the one thing that matters: machine-readable output.

type Level = "info" | "warn" | "error";

// Logs one JSON object per line ("structured logging"). Log aggregators
// (Vercel, Datadog, CloudWatch) can then parse, filter, and search by field —
// far more useful than free-text console.log strings.
//
// Concretely: `console.log("order " + id + " failed")` can only be grepped,
// while {"event":"order.failed","userId":"abc"} supports real queries like
// "every order.failed for this user today". Hence the dotted `event` naming
// convention (order.created, order.failed) — it groups related events.
//
// One caution: whatever you pass as context lands in the logs verbatim. Never
// log passwords, tokens, or full request bodies.
function log(level: Level, event: string, context?: Record<string, unknown>) {
  const line = JSON.stringify({
    level,
    event,
    time: new Date().toISOString(),
    ...context,
  });
  // Route to the matching console method so the platform tags severity
  // correctly — console.error goes to stderr, which is what lets you filter for
  // errors and alert on them.
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const logger = {
  info: (event: string, ctx?: Record<string, unknown>) =>
    log("info", event, ctx),
  warn: (event: string, ctx?: Record<string, unknown>) =>
    log("warn", event, ctx),
  error: (event: string, ctx?: Record<string, unknown>) =>
    log("error", event, ctx),
};
