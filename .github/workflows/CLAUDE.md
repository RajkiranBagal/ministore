# .github/workflows/

One file: `ci.yml`. Triggers on push to `main` and PRs targeting `main`.

## `verify` job
`ubuntu-latest`, job-level `env.DATABASE_URL: ${{ secrets.DATABASE_URL }}`.

`checkout@v4` → `setup-node@v4` (node 22, `cache: npm`) → `npm ci` → `npm run lint` → `npm test` → `npm run build`.

- **No separate typecheck step** — type errors are caught by `next build`. If you want fast type feedback, `npx tsc --noEmit` locally.
- `prisma generate` isn't called explicitly; it runs via the `postinstall` hook during `npm ci`. That's why `DATABASE_URL` is needed at the job level.
- `npm test` is Jest only. The Storybook/Vitest suite is **not** run in CI.

## `deploy` job
`needs: verify`, `if: github.ref == 'refs/heads/main'`. Runs `npx vercel deploy --prod --yes --token=${{ secrets.VERCEL_TOKEN }}` with `VERCEL_ORG_ID` / `VERCEL_PROJECT_ID`.

`vercel.json` sets `git.deploymentEnabled.main = false`, so **this CI-gated job is the only path to production** — pushing to `main` won't auto-deploy through Vercel's own Git integration.

Secrets required: `DATABASE_URL`, `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`.
