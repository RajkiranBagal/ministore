// ─── /api/auth/* — the Auth.js catch-all ────────────────────────────────────
// The folder name [...nextauth] is a CATCH-ALL dynamic segment: the `...`
// means it matches any depth of path below /api/auth, so this single file
// serves /api/auth/signin, /signout, /session, /csrf, /callback/credentials
// and the rest. Auth.js builds all of those internally; we only mount them.
//
// Nothing here is meant to be edited. The behaviour you'd want to change lives
// in two root files:
//   • auth.ts        — the Credentials provider, bcrypt check, jwt/session callbacks
//   • auth.config.ts — the edge-safe subset that proxy.ts imports to guard routes
import { handlers } from "@/auth";

export const { GET, POST } = handlers;
