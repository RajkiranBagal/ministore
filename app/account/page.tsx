import { auth } from "@/auth";

export default async function AccountPage() {
  const session = await auth();

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900">My Account</h1>
      <div className="mt-4 rounded-lg border border-gray-200 p-4">
        <p className="text-sm text-gray-500">Signed in as</p>
        <p className="font-medium">{session?.user?.name ?? "—"}</p>
        <p className="text-gray-700">{session?.user?.email}</p>
        <p className="mt-2 text-xs text-gray-400">
          User ID: {session?.user?.id}
        </p>
      </div>
    </main>
  );
}
