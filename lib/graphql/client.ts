// ─── Minimal browser-side GraphQL client ────────────────────────────────────
// ⚠️  CLIENT-ONLY (relative URL — resolves against the page origin).
//
// Deliberately NOT Apollo Client or urql. Those earn their weight when you need
// a normalised cache, optimistic updates, or subscriptions; this app needs to
// send a query string and read JSON back. A GraphQL request is an ordinary POST,
// and pretending otherwise is how people conclude GraphQL is heavy — the ~40 kB
// of client library is a choice, not a requirement.
//
// Add a real client when you actually need caching. Until then, this is 20 lines.

type GraphQLResponse<T> = {
  data?: T;
  errors?: Array<{ message: string }>;
};

export async function gqlRequest<T>(
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  const res = await fetch("/api/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });

  // A quirk worth knowing: GraphQL returns HTTP 200 even for query errors,
  // putting them in an `errors` array instead. So unlike REST, checking
  // `res.ok` is necessary but nowhere near sufficient — both checks are needed.
  if (!res.ok) {
    throw new Error(`GraphQL request failed: ${res.status}`);
  }

  const body: GraphQLResponse<T> = await res.json();

  if (body.errors?.length) {
    throw new Error(body.errors.map((e) => e.message).join("; "));
  }
  if (!body.data) {
    throw new Error("GraphQL response contained no data");
  }

  return body.data;
}
