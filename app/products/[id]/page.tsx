import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { fetchProduct } from "@/lib/api";
import AddToCartButton from "@/features/cart/AddToCartButton";

// params is a Promise in Next 16 — this is the key modern-API detail.
type Props = {
  params: Promise<{ id: string }>;
};

// Runs on the SERVER before the page renders. Sets the <title> and meta
// description per-product — real per-page SEO you can't get from client render.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const product = await fetchProduct(id).catch(() => null);
  if (!product) return { title: "Product not found — MiniStore" };
  return {
    title: `${product.title} — MiniStore`,
    description: product.description,
  };
}

// An ASYNC Server Component: it can await data directly, no useEffect/useState.
// The fetch happens on the server; the browser receives finished HTML.
export default async function ProductDetailPage({ params }: Props) {
  const { id } = await params;
  const product = await fetchProduct(id).catch(() => null);

  // notFound() renders the 404 page and stops. It returns `never`, so after
  // this line TypeScript knows `product` is non-null.
  if (!product) notFound();

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <Link href="/" className="text-sm text-blue-600 hover:underline">
        ← Back to products
      </Link>

      <div className="mt-6 grid gap-8 md:grid-cols-2">
        <div className="relative aspect-square rounded-lg bg-gray-100">
          <Image
            src={product.thumbnail}
            alt={product.title}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-contain p-4"
            priority
          />
        </div>

        <div>
          <p className="text-sm uppercase tracking-wide text-gray-500">
            {product.category}
          </p>
          <h1 className="mt-1 text-2xl font-bold text-gray-900">
            {product.title}
          </h1>
          <p className="mt-2 text-xl font-semibold text-gray-900">
            ${product.price.toFixed(2)}
          </p>
          <p className="mt-4 text-gray-700">{product.description}</p>

          <div className="mt-6">
            <AddToCartButton
              product={{
                id: product.id,
                title: product.title,
                price: product.price,
                thumbnail: product.thumbnail,
              }}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
