type Level = "info" | "warn" | "error";

// Logs one JSON object per line ("structured logging"). Log aggregators
// (Vercel, Datadog, CloudWatch) can then parse, filter, and search by field —
// far more useful than free-text console.log strings.
function log(level: Level, event: string, context?: Record<string, unknown>) {
  const line = JSON.stringify({
    level,
    event,
    time: new Date().toISOString(),
    ...context,
  });
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
