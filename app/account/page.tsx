// ─── /account ───────────────────────────────────────────────────────────────
// The signed-in landing page. Shows who you are and links to order history.

import { auth } from "@/auth";
import Link from "next/link";

// Async Server Component — reads the session on the server, so the user's
// details are baked into the HTML rather than fetched after load.
//
// Why there's no `redirect("/login")` guard here: every /account/* route is
// already gated by proxy.ts (`matcher: ["/account/:path*"]`), which runs BEFORE
// this component and bounces unauthenticated requests. The optional chaining
// below is just TypeScript satisfaction — `session` is typed as possibly null,
// even though in practice the proxy guarantees it isn't.
//
// Compare with account/orders/page.tsx, which DOES re-check. That page needs
// `session.user.id` as a query argument, so a missing session there would be a
// real bug rather than a cosmetic one — worth the redundant guard.
export default async function AccountPage() {
  const session = await auth();

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900">My Account</h1>
      <div className="mt-4 rounded-lg border border-gray-200 p-4">
        <p className="text-sm text-gray-500">Signed in as</p>
        {/* `name` is optional at signup, so show an em dash when it's absent. */}
        <p className="font-medium">{session?.user?.name ?? "—"}</p>
        <p className="text-gray-700">{session?.user?.email}</p>
        {/* `user.id` only exists on the session because we put it there: the
            jwt/session callbacks in auth.ts copy it across, and types/next-auth.d.ts
            widens Auth.js's Session type so TypeScript knows about it. */}
        <p className="mt-2 text-xs text-gray-400">
          User ID: {session?.user?.id}
        </p>
      </div>
      <Link
        href="/account/orders"
        className="mt-4 inline-block text-blue-600 hover:underline"
      >
        View order history →
      </Link>
    </main>
  );
}
