// ─── Route guard (formerly "middleware") ────────────────────────────────────
// Runs BEFORE a matching request reaches any page or handler — the first line
// of defence for protected routes. Must live at the project root with this
// exact filename; Next discovers it by convention.

import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

// Next.js 16 renamed the "middleware" convention to "proxy" (runs on the
// Node.js runtime now). We still use the edge-safe config split — it keeps
// this file lean: no Prisma/bcrypt needed just to gate routes. Auth.js's
// `auth` handler reads the JWT cookie and applies the `authorized` callback.
const { auth } = NextAuth(authConfig);

export default auth;

// Only run for these paths (keeps it off static assets and public routes).
//
// `:path*` matches /account and everything beneath it. Narrow matchers matter:
// a broad one would run this on every image and font request too.
//
// The decision itself lives in the `authorized` callback in auth.config.ts —
// this just decides WHEN to ask. Protecting a new route means updating both.
//
// And remember this is a first line of defence, not the only one. Route
// handlers still check the session themselves (POST /api/orders returns 401),
// because a guard that lives in one config file is one careless edit away from
// being disabled.
export const config = {
  matcher: ["/account/:path*"],
};
