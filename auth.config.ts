// ─── Auth.js — edge-safe configuration ──────────────────────────────────────
// ⚠️  EDGE-SAFE: do NOT import Prisma, bcrypt, or any Node-only module here.
//
// proxy.ts imports this file to guard routes on every matching request. Keeping
// it dependency-free means route guarding costs almost nothing and stays
// portable across runtimes. The heavy Credentials provider (which does need
// Prisma and bcrypt) is added separately in auth.ts. If you add an import here
// and the build starts complaining about Node APIs, this is why.

import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  // "jwt" = the session lives in a signed, encrypted cookie, so verifying a
  // request needs no database lookup — which is what lets the check run in the
  // proxy cheaply. The alternative, "database", supports instant server-side
  // revocation but costs a query per request. Trade-off: a JWT stays valid
  // until it expires, so you can't force-log-someone-out immediately.
  session: { strategy: "jwt" },

  // Where Auth.js sends unauthenticated users instead of its own built-in page.
  pages: { signIn: "/login" },

  // Intentionally empty — auth.ts spreads this object and supplies the real
  // provider. This file only needs enough config to READ an existing session.
  providers: [],

  callbacks: {
    // Runs when the token is created or updated. `user` is only present at
    // sign-in (the object returned by authorize() in auth.ts), so this copies
    // the database id onto the token exactly once, at login.
    jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },

    // Runs whenever the session is read. Copies the id from the token onto the
    // session object your components actually see.
    //
    // Both callbacks are needed because `id` is NOT part of Auth.js's default
    // session shape — the type augmentation in types/next-auth.d.ts teaches
    // TypeScript about it, and these two callbacks put the value there at
    // runtime. Types alone wouldn't make the data appear.
    session({ session, token }) {
      if (token.id) session.user.id = token.id as string;
      return session;
    },

    // Runs in the proxy (middleware) to decide access. Returning false on a
    // protected route while logged out makes Auth.js redirect to `pages.signIn`.
    //
    // Note this pathname check duplicates the `matcher` in proxy.ts. The
    // matcher decides whether this callback runs at all (a performance filter);
    // this check decides the answer. Belt and suspenders — but if you protect a
    // new path, remember BOTH need updating.
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const isProtected = request.nextUrl.pathname.startsWith("/account");
      if (isProtected) return isLoggedIn;
      return true; // everything else is public
    },
  },
  // `satisfies` type-checks this object against NextAuthConfig while keeping
  // the precise literal types — plain `: NextAuthConfig` would widen them.
} satisfies NextAuthConfig;
