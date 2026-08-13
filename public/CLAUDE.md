# public/ — Static assets

Five untouched create-next-app SVGs: `file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg`. Flat, no subdirectories.

Served at the root (`/next.svg`) and mounted into Storybook via `staticDirs: ["../public"]` in `.storybook/main.ts`.

**The app doesn't reference any of them.** Product imagery is remote, loaded through `next/image` from `cdn.dummyjson.com` (the only host allowed in `next.config.ts`). Adding a new remote image host requires editing `images.remotePatterns` there.
