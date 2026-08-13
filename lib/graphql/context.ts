// ─── GraphQL request context ────────────────────────────────────────────────
// The context is built once per request and handed to every resolver. It's
// where request-scoped things belong — here, the signed-in user.
//
// Nothing in the current schema is behind auth (products are public, exactly
// like GET /api/products). The session is threaded through anyway so that
// adding a protected field later is a one-line change rather than a refactor,
// and so resolvers have a single obvious place to read identity from.

import { auth } from "@/auth";

export type GraphQLContext = {
  /** The signed-in user's id, or null when anonymous. */
  userId: string | null;
};

export async function createContext(): Promise<GraphQLContext> {
  const session = await auth();
  return { userId: session?.user?.id ?? null };
}
