import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // next/image blocks external URLs by default (security). We explicitly
    // allow the DummyJSON CDN so <Image> can optimize product thumbnails.
    remotePatterns: [{ protocol: "https", hostname: "cdn.dummyjson.com" }],
  },
};

export default nextConfig;
