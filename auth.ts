// ─── Auth.js — full configuration (Node runtime) ────────────────────────────
// This is HALF of a deliberate two-file split:
//
//   auth.config.ts  — edge-safe. No Prisma, no bcrypt. proxy.ts imports it so
//                     route guarding stays lightweight.
//   auth.ts (here)  — the full config, including the database and bcrypt.
//
// Why split at all? proxy.ts runs on every matching request just to check a
// cookie. It must not drag Prisma and bcrypt (native, heavy, and not always
// edge-compatible) into that path. So the shared bits live in the config file
// and the heavy provider is bolted on here, where a Node runtime is available.
//
// Import THIS file (`@/auth`) anywhere you need `auth()`, `signIn`, `signOut`
// or the route handlers.

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { authConfig } from "@/auth.config";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig, // session strategy, pages, jwt/session callbacks
  providers: [
    // "Credentials" = classic email + password. Auth.js supports OAuth
    // providers (Google, GitHub…) as drop-in alternatives; credentials means
    // we own the password storage, hence the bcrypt work below.
    Credentials({
      // Shape of the fields. Auth.js can auto-render a sign-in form from this,
      // though we use our own at app/login/page.tsx.
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },

      // The heart of it. Return a user object to grant a session, or null to
      // deny. Note EVERY failure path below returns a bare `null`, never a
      // reason — that's intentional. Distinguishing "no such user" from "wrong
      // password" hands an attacker a way to enumerate which emails have
      // accounts. The login page shows one generic message for the same reason.
      authorize: async (credentials, request) => {
        // Throttle credential stuffing: 10 attempts per minute per IP.
        const limit = rateLimit(`login:${clientIp(request)}`, 10, 60_000);
        if (!limit.ok) return null;

        // `credentials` is typed as unknown-ish, so narrow before use.
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return null;

        // bcrypt.compare re-hashes the submitted password with the salt baked
        // into the stored hash and compares in constant time. We never decrypt
        // anything — hashes are one-way, which is the entire point.
        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        // Whatever we return here is handed to the `jwt` callback in
        // auth.config.ts, which copies `id` onto the token. Return only safe
        // fields — never the passwordHash, which ends up in the session cookie.
        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
});
