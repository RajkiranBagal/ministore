// ─── Site header ────────────────────────────────────────────────────────────
// Note this file lives in app/ but is NOT a route: only reserved filenames
// (page, layout, route, loading, error…) become routes, so a component named
// Header.tsx is just a component that happens to sit next to the layout.
// Colocating it here is a deliberate choice — it's used only by the layout.

import Link from "next/link";
import { auth } from "@/auth";
import CartWidget from "@/features/cart/CartWidget";
import SignOutButton from "@/features/auth/SignOutButton";

// An async Server Component. Two things follow from that:
//
//  1. We can `await` the session directly — no useEffect, no loading state, no
//     flash of "logged out" UI. The HTML arrives already correct.
//  2. The session never reaches the browser as JS state. Only the rendered
//     markup ships, so we can read server-only data here safely.
//
// The trade-off: because this renders on the server, it does NOT re-render when
// client-side auth state changes. That's exactly why the login and signup pages
// call `router.refresh()` after signing in — it asks the server to re-render
// this header so it picks up the new session.
export default async function Header() {
  const session = await auth();

  return (
    <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        {/* next/link prefetches the target route and navigates client-side,
            preserving Redux state (an <a> would hard-reload and empty the cart). */}
        <Link href="/" className="text-lg font-bold text-gray-900">
          MiniStore
        </Link>

        <div className="flex items-center gap-4">
          {session?.user ? (
            <>
              {/* `name` is optional at signup, so fall back to the email. */}
              <span className="text-sm text-gray-600">
                Hi, {session.user.name ?? session.user.email}
              </span>
              <SignOutButton />
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-medium text-blue-600 hover:underline"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="text-sm font-medium text-blue-600 hover:underline"
              >
                Sign up
              </Link>
            </>
          )}
          {/* Always visible — the cart works signed-out; you only need an
              account at checkout (the POST /api/orders handler returns 401). */}
          <CartWidget />
        </div>
      </div>
    </header>
  );
}
