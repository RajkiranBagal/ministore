// ─── Sign out ───────────────────────────────────────────────────────────────
// A client island inside the server-rendered <Header>. Signing out needs an
// onClick handler, and Server Components can't have those — so this three-line
// component is the smallest thing that has to ship as JavaScript.
"use client";

import { signOut } from "next-auth/react";

export default function SignOutButton() {
  return (
    <button
      // type="button" matters: inside a <form>, a button defaults to
      // type="submit" and would submit it. Being explicit avoids that trap.
      type="button"
      // signOut clears the session cookie, then hard-navigates to callbackUrl.
      // That full navigation is deliberate — it re-runs every Server Component
      // so nothing stale (like the "Hi, name" greeting) survives. It's also why
      // this needs no router.refresh(), unlike the login and signup pages.
      onClick={() => signOut({ callbackUrl: "/" })}
      className="text-sm text-gray-600 hover:text-gray-900 hover:underline"
    >
      Log out
    </button>
  );
}
