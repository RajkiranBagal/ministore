// ─── /login ─────────────────────────────────────────────────────────────────
// One of only two pages in the app marked "use client". A login form is pure
// interactivity — local state, an event handler, a browser-side API call — so
// there's nothing for a Server Component to contribute. Everywhere else we keep
// pages server-rendered and push interactivity into small client islands.
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Button from "@/components/Button/Button";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  // Tracks the in-flight request so we can disable the button and change its
  // label — without this, an impatient double-click fires two sign-in attempts.
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    // Stop the browser's default form submission (a full page reload).
    e.preventDefault();
    setError(null); // clear any error from a previous attempt
    setPending(true);

    // This form is UNCONTROLLED: the inputs have `name` attributes and no
    // useState/value/onChange. We read the values at submit time via FormData
    // instead of re-rendering on every keystroke. Less code, and faster.
    const form = new FormData(e.currentTarget);

    // signIn triggers the Credentials provider -> your authorize() runs (auth.ts).
    // redirect:false lets US handle success/failure instead of Auth.js
    // redirecting the browser, which is what makes inline errors possible.
    const res = await signIn("credentials", {
      email: form.get("email"),
      password: form.get("password"),
      redirect: false,
    });

    setPending(false);
    if (res?.error) {
      // Deliberately generic. authorize() already refuses to say whether the
      // email exists; echoing a specific reason here would undo that and let
      // someone enumerate registered accounts.
      setError("Invalid email or password");
    } else {
      router.push("/"); // logged in -> home
      // REQUIRED, and easy to forget: push() alone reuses the cached server
      // render, so the <Header> would still show "Log in". refresh() re-runs
      // the Server Components so they pick up the new session cookie.
      router.refresh();
    }
  }

  return (
    <main className="mx-auto max-w-sm px-4 py-12">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Log in</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* role="alert" makes screen readers announce this the moment it
            appears — a sighted user sees the red box, and this is the
            equivalent signal for everyone else. */}
        {error && (
          <p
            className="rounded bg-red-50 p-2 text-sm text-red-700"
            role="alert"
          >
            {error}
          </p>
        )}
        <div>
          {/* htmlFor must match the input's id: that pairing is what lets a
              screen reader announce the field, and what makes clicking the
              label focus the input. */}
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700"
          >
            Email
          </label>
          <input
            id="email"
            name="email" // the key FormData reads above
            type="email" // mobile keyboards adapt; browsers validate the format
            required
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>
        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700"
          >
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Logging in…" : "Log in"}
        </Button>
      </form>
    </main>
  );
}
