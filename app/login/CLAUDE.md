# app/login/

`/login` — one file, `page.tsx`, `"use client"`.

Uncontrolled form → `FormData` → `signIn("credentials", { email, password, redirect: false })` from `next-auth/react`. On success: `router.push("/")` **then `router.refresh()`** — the refresh is required, otherwise the server-rendered `app/Header.tsx` keeps showing the logged-out state.

All failures collapse to a generic "Invalid email or password" in a `role="alert"` block (deliberate — don't leak whether the email exists). Button comes from `@/components/Button/Button`.
