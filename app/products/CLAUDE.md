# app/products/

Only `[id]/` exists — **there is no `/products` listing page**. The catalog lives on `/` (`app/page.tsx` → `features/products/ProductGrid.tsx`). If you add `app/products/page.tsx`, you're creating a new route, not filling in a stub.

See `[id]/CLAUDE.md` for the detail page.
