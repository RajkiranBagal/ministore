// ─── POST/GET /api/graphql ──────────────────────────────────────────────────
// GraphQL Yoga mounted as a Next.js route handler.
//
// Worth being clear about what Yoga is and isn't: it is NOT a different
// GraphQL. The `graphql` package is the engine that parses, validates and
// executes queries; Yoga is the HTTP layer around it — spec-compliant
// GraphQL-over-HTTP, GraphiQL, error masking, plugins. The schema in
// lib/graphql/schema.ts would run unchanged under Apollo Server.
//
// SCOPE: read-only. Mutations stay on REST — see the rate-limiting note below.

import { createYoga } from "graphql-yoga";
import { maxDepthPlugin } from "@escape.tech/graphql-armor-max-depth";
import { schema } from "@/lib/graphql/schema";
import { createContext } from "@/lib/graphql/context";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { errorResponse } from "@/lib/api-response";

const isProduction = process.env.NODE_ENV === "production";

const { handleRequest } = createYoga<{
  req: Request;
}>({
  schema,
  context: createContext,

  // Must match this route's path or Yoga's internal routing 404s.
  graphqlEndpoint: "/api/graphql",

  // Yoga needs the runtime's Response to build replies inside Next.
  fetchAPI: { Response },

  // GraphiQL (the in-browser explorer) is a development tool. Leaving it and
  // introspection enabled in production hands an attacker a complete, readable
  // map of the API surface — free reconnaissance. Off in prod.
  graphiql: !isProduction,

  maskedErrors: isProduction,

  parserAndValidationCache: true,

  // ── Depth limiting — NOT optional here ────────────────────────────────────
  // `related` returns Products, which themselves have a `related` field, so the
  // schema is recursive. A query like
  //   { product { related { related { related { related { id } } } } } }
  // fans out exponentially: 4 levels is ~256 chained calls to the FastAPI
  // service. Measured before this plugin was added, that query took **15.5
  // seconds** and returned HTTP 200 — a trivially writable denial-of-service.
  //
  // This is the concrete safety property REST gave us for free: one endpoint,
  // one fixed-cost query. It's the clearest argument in this whole experiment
  // for why a public GraphQL endpoint needs deliberate hardening that a REST
  // route does not.
  //
  // Calibrating `n` requires knowing how it counts: `{ product { title } }`
  // measures as depth 2, not 1. Both queries this app actually issues —
  //   { products(…) { products { …fields } pagination { … } } }
  //   { product(id:…) { related { …fields } } }
  // measure as 3, so n=4 leaves exactly one level of headroom.
  //
  // At 4, a single `related → related` nesting is still permitted (bounded, ~16
  // rows), while the exponential cases are rejected at parse time, before any
  // resolver — and therefore before any call to the Python service — runs.
  plugins: [maxDepthPlugin({ n: 4 })],
});

/**
 * Rate limiting is applied at the transport level rather than per resolver.
 *
 * This is the honest weak point of putting everything behind one endpoint: the
 * REST routes get meaningful per-action limits (checkout 10/min, signup 5/min)
 * because each action has its own URL. Here every query is the same POST, so
 * the best a transport-level limit can do is cap total request volume — it
 * cannot tell a cheap product lookup from an expensive nested one.
 *
 * That asymmetry is exactly why the mutations stayed on REST.
 */
async function handler(request: Request): Promise<Response> {
  const limit = rateLimit(`graphql:${clientIp(request)}`, 60, 60_000);
  if (!limit.ok) {
    return errorResponse("Too many requests. Please try again later.", 429);
  }
  return handleRequest(request, { req: request });
}

export { handler as GET, handler as POST };
