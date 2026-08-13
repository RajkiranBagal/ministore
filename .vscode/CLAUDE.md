# .vscode/

Editor settings, committed so formatting stays consistent.

- `extensions.json` — recommends `esbenp.prettier-vscode` and `dbaeumer.vscode-eslint`.
- `settings.json` — format on save with Prettier, `source.fixAll.eslint` as an explicit code action, ESLint validating js/jsx/ts/tsx.

Prettier config is `.prettierrc.json` at the repo root; ESLint is `eslint.config.mjs` (flat config, `eslint-config-next` + `eslint-config-prettier` so the two don't fight). No formatting npm script exists — the editor is the formatter, and CI enforces via `npm run lint`.
