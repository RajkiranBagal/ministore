// ─── /products/[id] — product detail ────────────────────────────────────────
// A dynamic route: the [id] folder name captures whatever is in that URL slot,
// so /products/42 renders this file with id = "42".

import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProduct } from "@/lib/products";
import AddToCartButton from "@/features/cart/AddToCartButton";
import RelatedProducts from "@/features/products/RelatedProducts";

// Next 16 makes `params` a PROMISE — you must await it. (In older versions it
// was a plain object; this is one of the App Router's breaking changes.) The
// reason is streaming: Next can start rendering before the params resolve.
type Props = {
  params: Promise<{ id: string }>;
};

// Runs on the server BEFORE the page renders, and its return value becomes the
// <title> and <meta> tags. This is what makes a product page shareable and
// indexable — a client-side-rendered price page would show a generic title to
// Google and to link previews.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(Number(id));
  if (!product) return { title: "Product not found — MiniStore" };
  return {
    title: `${product.title} — MiniStore`,
    description: product.description,
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { id } = await params;

  // Direct database query — no fetch(), no API endpoint. A Server Component
  // reads Postgres itself; going through our own HTTP layer would add a
  // pointless network hop. `id` arrives from the URL as a string, so convert.
  //
  // This LOOKS like a second identical query (generateMetadata already called
  // it), but it isn't: getProduct is wrapped in React's cache(), which dedupes
  // calls within a single request. Both callers share one database round-trip.
  // See lib/products.ts for the two caching layers.
  const product = await getProduct(Number(id));

  // getProduct returns null for a missing product AND for a non-numeric id
  // (it guards Number.isInteger), so /products/abc lands here too rather than
  // blowing up in Prisma. notFound() throws and renders the 404 page.
  if (!product) notFound();

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <Link href="/" className="text-sm text-blue-600 hover:underline">
        ← Back to products
      </Link>

      <div className="mt-6 grid gap-8 md:grid-cols-2">
        {/* `fill` makes the image expand to this parent, so the parent must be
            `relative` and have a size. aspect-square reserves the space before
            the image loads, which prevents layout shift (a Core Web Vital). */}
        <div className="relative aspect-square rounded-lg bg-gray-100">
          <Image
            src={product.thumbnail}
            alt={product.title}
            fill
            // Tells Next which image widths to generate and lets the browser
            // pick: full viewport width on mobile, half on desktop (2 columns).
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-contain p-4"
            // This is the largest visible image on the page — the LCP element.
            // `priority` preloads it instead of lazy-loading it.
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
          {/* getProduct already converted cents → dollars, so this is a float;
              toFixed(2) keeps "10.5" from rendering as $10.5. */}
          <p className="mt-2 text-xl font-semibold text-gray-900">
            ${product.price.toFixed(2)}
          </p>
          <p className="mt-4 text-gray-700">{product.description}</p>

          <div className="mt-6">
            {/* A client island inside a server page. We pass only the four
                fields the cart needs rather than the whole product — props
                cross the server→client boundary as serialized JSON, so keeping
                them small keeps the page's JS payload small. */}
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
      {/* Fetches from the Python service in the browser. It renders null on any
          failure, so the page still works when that service is asleep. */}
      <RelatedProducts productId={product.id} />
    </main>
  );
}
