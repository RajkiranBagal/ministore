# app/api/auth/register/

`POST /api/auth/register` — one file, `route.ts`.

Rate limit (5/min per IP, sets `Retry-After`) → `signupSchema.safeParse` → duplicate-email 409 → `bcrypt.hash(pw, 10)` → `prisma.user.create`. Returns 201 `{id, email, name}`; never returns `passwordHash`.

Full contract table in `../CLAUDE.md`.
