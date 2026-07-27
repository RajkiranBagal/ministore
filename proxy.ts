import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

// Next.js 16 renamed the "middleware" convention to "proxy" (runs on the
// Node.js runtime now). We still use the edge-safe config split — it keeps
// this file lean: no Prisma/bcrypt needed just to gate routes. Auth.js's
// `auth` handler reads the JWT cookie and applies the `authorized` callback.
const { auth } = NextAuth(authConfig);

export default auth;

// Only run for these paths (keeps it off static assets and public routes).
export const config = {
  matcher: ["/account/:path*"],
};
