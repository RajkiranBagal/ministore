# types/ — Ambient declarations

One file: `next-auth.d.ts`. Module augmentation only, **no runtime exports and imported by nothing** — TypeScript picks it up through tsconfig's `include: ["**/*.ts"]`.

- `declare module "next-auth"` → adds `id: string` to `Session["user"]` (`{ id: string } & DefaultSession["user"]`)
- `declare module "next-auth/jwt"` → adds `JWT.id?: string`

These must stay in sync with the `jwt`/`session` callbacks in `auth.ts`, which are what actually put `id` on the token and session. Change one, change the other.

Domain types are **not** here — they live next to their feature (`features/cart/types.ts`, `features/products/types.ts`) or come from the generated Prisma client.
