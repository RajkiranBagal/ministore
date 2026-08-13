// ─── Error response helper ──────────────────────────────────────────────────
// Currently used by app/api/orders/route.ts. app/api/auth/register/route.ts
// still hand-rolls its errors — this helper is the intended pattern for both.

import { NextResponse } from "next/server";

// One consistent shape for ALL API error responses:
//   { "error": "<message>" }              or
//   { "error": "<message>", "details": … }
// A single predictable shape means clients can always read `error` the same way.
export function errorResponse(
  message: string,
  status: number,
  details?: unknown
) {
  // Omit `details` entirely when absent rather than sending `details: undefined`
  // — JSON.stringify drops undefined keys anyway, but being explicit keeps the
  // contract clear: the key is either present with content, or not there.
  return NextResponse.json(
    details !== undefined ? { error: message, details } : { error: message },
    { status }
  );
}
