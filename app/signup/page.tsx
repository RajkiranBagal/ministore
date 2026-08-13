// ─── /signup ────────────────────────────────────────────────────────────────
// Registration is a TWO-STEP flow, because Auth.js only knows how to sign
// people in — creating the account is our own endpoint. So: POST to
// /api/auth/register, then immediately sign in with the same credentials, so
// the user lands logged in rather than being bounced to a login form.
"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Button from "@/components/Button/Button";

export default function SignupPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); // suppress the browser's own form submit
    setError(null);
    setPending(true);

    // Uncontrolled form — values are read at submit time rather than tracked
    // in state on every keystroke. See app/login/page.tsx for the same pattern.
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email"));
    const password = String(form.get("password"));
    const name = String(form.get("name"));

    // ── Step 1: create the account ────────────────────────────────────────
    // `name || undefined` matters: an untouched optional input yields "", and
    // the Zod schema requires a non-empty string IF the key is present. Sending
    // undefined omits the key entirely, which is what "optional" means.
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name: name || undefined }),
    });

    if (!res.ok) {
      // Surface the server's own message ("An account with this email already
      // exists") rather than a generic one — unlike login, there's nothing to
      // leak here, since the duplicate-email case is information the user needs.
      // `.catch(() => ({}))` guards against a non-JSON error body.
      const data = await res.json().catch(() => ({}));
      setPending(false);
      setError(data.error ?? "Could not create account");
      return;
    }

    // ── Step 2: log them straight in ──────────────────────────────────────
    const login = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setPending(false);
    if (login?.error) {
      // Rare but possible: the account exists now, only the sign-in failed.
      // Say so precisely — telling them signup failed would be a lie that leads
      // them to retry and hit "email already exists".
      setError("Account created, but sign-in failed. Try logging in.");
    } else {
      router.push("/");
      router.refresh(); // re-render Server Components so <Header> sees the session
    }
  }

  return (
    <main className="mx-auto max-w-sm px-4 py-12">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Create account</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <p
            className="rounded bg-red-50 p-2 text-sm text-red-700"
            role="alert"
          >
            {error}
          </p>
        )}
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700"
          >
            Name <span className="text-gray-400">(optional)</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700"
          >
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
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
            // Mirrors `password: z.string().min(8)` in lib/validation.ts. This
            // is a UX convenience only — the browser can be bypassed trivially,
            // so the server schema is the real enforcement. Change both together.
            minLength={8}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
          <p className="mt-1 text-xs text-gray-500">At least 8 characters.</p>
        </div>
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Creating…" : "Create account"}
        </Button>
        <p className="text-center text-sm text-gray-600">
          Already have an account?{" "}
          <Link href="/login" className="text-blue-600 hover:underline">
            Log in
          </Link>
        </p>
      </form>
    </main>
  );
}
