# app/api/auth/ — Auth.js v5 endpoints + registration

Two subdirectories. The real auth wiring lives at the repo root in `auth.ts` / `auth.config.ts`, not here.

## `[...nextauth]/route.ts`

Three lines: `export const { GET, POST } = handlers` from `@/auth`. Serves the standard Auth.js surface — `/api/auth/signin`, `/signout`, `/session`, `/csrf`, `/callback/credentials`.

The logic you'd want to edit is in **`auth.ts`** (repo root): the Credentials provider's `authorize()` rate-limits `login:<ip>` to 10/min, looks the user up by email, `bcrypt.compare`s against `passwordHash`, and returns `{id, email, name}` or `null`. Session strategy is `jwt`; `jwt`/`session` callbacks copy `user.id` onto the session.

**`auth.config.ts` must stay edge-safe** — no Prisma, no bcrypt imports. It holds only `pages.signIn` and the `authorized` callback so `proxy.ts` can import it cheaply.

## `register/route.ts`

`export async function POST(request: Request)`.

Request — `signupSchema`: `{ email, password (min 8), name? }`.

| Status | Body |
|---|---|
| 201 | `{ id, email, name }` — never `passwordHash` |
| 400 | `{ error: "Invalid input", details }` |
| 409 | `{ error: "An account with this email already exists" }` |
| 429 | `{ error: "Too many requests…" }` + **`Retry-After` header** (only route that sets it) |

Sequence: `rateLimit("signup:"+ip, 5, 60_000)` → `safeParse` → duplicate-email check → `bcrypt.hash(password, 10)` → `prisma.user.create`.

Uses raw `NextResponse.json` instead of `errorResponse()` from `@/lib/api-response` — inconsistent with `app/api/orders/`; prefer the helper if you rewrite it.
