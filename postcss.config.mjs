// ─── PostCSS configuration ──────────────────────────────────────────────────
// PostCSS is the CSS build pipeline Next runs your stylesheets through. Tailwind
// is a PostCSS plugin: it scans your files for class names and generates the
// matching CSS at build time, which is why unused utilities never ship.
//
// Tailwind v4 note: the plugin moved to its own package (@tailwindcss/postcss),
// and autoprefixer is no longer needed — v4 handles vendor prefixing itself.
// Older tutorials showing `tailwindcss` and `autoprefixer` here are v3.
//
// Everything else Tailwind needs (theme tokens, fonts) is configured in CSS,
// in app/globals.css — there is no tailwind.config.js in v4.
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
