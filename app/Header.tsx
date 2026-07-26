import Link from "next/link";
import { auth } from "@/auth";
import CartWidget from "@/features/cart/CartWidget";
import SignOutButton from "@/features/auth/SignOutButton";

// A Server Component: it reads the session on the server with auth().
export default async function Header() {
  const session = await auth();

  return (
    <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-bold text-gray-900">
          MiniStore
        </Link>

        <div className="flex items-center gap-4">
          {session?.user ? (
            <>
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
          <CartWidget />
        </div>
      </div>
    </header>
  );
}
