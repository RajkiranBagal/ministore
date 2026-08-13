# app/signup/

`/signup` — one file, `page.tsx`, `"use client"`.

Two-step flow: `POST /api/auth/register` (reads `data.error` off the response for the message), then immediately `signIn("credentials", { redirect: false })`, then `router.push("/")` + `router.refresh()` (refresh so the server-rendered `Header` picks up the session).

`minLength={8}` on the password input mirrors `signupSchema` in `@/lib/validation` — change both together. Blank `name` is sent as `undefined`, not `""`.
