# services/ — Out-of-process services

Non-Node services deployed separately from the Next app. Currently one: `recommendations/` (Python/FastAPI on Render).

These are **not** part of the Next build, not in `tsconfig`, not covered by `npm test` or CI. They read the same Neon Postgres database directly rather than calling back into the Next API.

Rule of thumb: the storefront must work when a service here is down. `RelatedProducts.tsx` renders `null` on any failure — keep that graceful-degradation posture for anything new added here.
