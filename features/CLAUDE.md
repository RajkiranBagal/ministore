# features/ — Domain UI

Feature-first folders holding the client-side domain logic. Contrast with `components/`, which is generic and store-free.

```
features/auth/      SignOutButton
features/cart/      slice + money math + 4 components
features/products/  Product type + grid/card/related
```

## Conventions

- **No barrel `index.ts` in any feature folder.** Import full paths: `@/features/cart/cartSlice`.
- Components: default export. Slice actions, pure functions, and types: named exports.
- Cross-folder imports use `@/...`; same-folder stays relative (`./types`, `./totals`).
- Each feature owns a local `types.ts` (`CartItem`, `Product`) — these are **API/UI shapes, deliberately narrower than the Prisma models**. Don't import Prisma types into components.
- These are the `"use client"` islands that `app/` Server Components render. Keep the pages server-side and put interactivity here.
- **No tests and no stories exist under `features/`** — even though `.storybook/main.ts` globs `../features/**/*.stories.*`. The blocker for stories is the missing Redux `<Provider>` decorator in `.storybook/preview.tsx`.

## Testing

Pure logic is tested, components are not: `cartSlice.test.ts` and `totals.test.ts` are the only test files here, both Jest. Keep money math and reducers as pure functions so they stay testable without a renderer.
