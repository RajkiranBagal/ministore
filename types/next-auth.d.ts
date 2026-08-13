// ─── Auth.js type augmentation ──────────────────────────────────────────────
// A `.d.ts` file: declarations only, no runtime code. Nothing imports it —
// TypeScript picks it up automatically because tsconfig's `include` covers
// **/*.ts. It disappears entirely at build time.

import { DefaultSession } from "next-auth";

// We added a custom `id` to the session user and JWT in auth.ts's callbacks.
// These declarations tell TypeScript about them, so `session.user.id` is typed.
//
// This is DECLARATION MERGING: re-declaring an interface from another module
// merges your fields into theirs rather than replacing it. It's how you extend
// a library's types without forking the library.
//
// ⚠️  Crucial point: this only changes TYPES, never runtime behaviour. Writing
// `id` here does not put an id on the session — the jwt/session callbacks in
// auth.config.ts do that. The two must be kept in step: types without the
// callbacks means `session.user.id` compiles and is undefined at runtime.
declare module "next-auth" {
  interface Session {
    // Intersect with DefaultSession["user"] to KEEP the built-in name/email/
    // image fields. Writing `user: { id: string }` alone would override them
    // and break every existing usage.
    user: { id: string } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    // Optional, because the token exists before the jwt callback attaches an
    // id — which is exactly why auth.config.ts guards with `if (token.id)`.
    id?: string;
  }
}
