import ProductGrid from "@/features/products/ProductGrid";

// No "use client" here — this page stays a Server Component. It renders a
// static header on the server and drops in <ProductGrid /> as a client
// "island" that handles fetching and interactivity. Server shell + client
// island is the recommended App Router pattern.
export default function Home() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">MiniStore</h1>
      <ProductGrid />
    </main>
  );
}
