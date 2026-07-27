import type { NextConfig } from "next";

// Baseline security headers applied to every response.
const securityHeaders = [
  // Force HTTPS for 2 years (browsers refuse plain HTTP after the first visit).
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  // Stop browsers from MIME-sniffing a response into a different content type.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Disallow the site being embedded in an <iframe> (clickjacking protection).
  { key: "X-Frame-Options", value: "DENY" },
  // Don't leak full URLs to other origins in the Referer header.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Deny access to powerful browser features we don't use.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

const nextConfig: NextConfig = {
  images: {
    // next/image blocks external URLs by default (security). We explicitly
    // allow the DummyJSON CDN so <Image> can optimize product thumbnails.
    remotePatterns: [{ protocol: "https", hostname: "cdn.dummyjson.com" }],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
