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
  return NextResponse.json(
    details !== undefined ? { error: message, details } : { error: message },
    { status }
  );
}
