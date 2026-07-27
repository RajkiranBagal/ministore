"use client";

import { signOut } from "next-auth/react";

export default function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/" })}
      className="text-sm text-gray-600 hover:text-gray-900 hover:underline"
    >
      Log out
    </button>
  );
}
