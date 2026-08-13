# app/api/auth/[...nextauth]/

One 3-line file re-exporting Auth.js handlers: `export const { GET, POST } = handlers` from `@/auth`.

Nothing to change here. Edit `auth.ts` (providers, `authorize()`, callbacks) or `auth.config.ts` (edge-safe route guard) at the repo root instead. Context: `../CLAUDE.md`.
