import type { NextAuthConfig } from "next-auth";

// EDGE-SAFE: no Prisma, no bcrypt. Safe for the middleware's Edge runtime.
export const authConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [], // the real provider is added in auth.ts (Node runtime)
  callbacks: {
    jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    session({ session, token }) {
      if (token.id) session.user.id = token.id as string;
      return session;
    },
    // Runs in the middleware to decide access. Returning false on a protected
    // route (while logged out) makes Auth.js redirect to the signIn page.
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const isProtected = request.nextUrl.pathname.startsWith("/account");
      if (isProtected) return isLoggedIn;
      return true; // everything else is public
    },
  },
} satisfies NextAuthConfig;
