# features/auth/

One file: `SignOutButton.tsx` — `"use client"`, default export, calls `signOut({ callbackUrl: "/" })` from `next-auth/react`. Rendered by `app/Header.tsx` when a session exists.

Sign-*in* is not here — it's the form at `app/login/page.tsx`. Server-side auth config lives at the repo root (`auth.ts`, `auth.config.ts`).
