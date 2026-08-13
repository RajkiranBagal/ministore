// ─── Root layout ────────────────────────────────────────────────────────────
// The App Router requires exactly one root layout, and it's the only place we
// get to render <html> and <body>. It wraps EVERY page in the app, and it does
// not re-render on navigation — Next keeps the layout mounted and swaps only
// `children`. That's why the Redux <Providers> lives here: putting it in the
// layout means the cart survives client-side navigation between pages.

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Providers from "@/store/Providers";
import Header from "./Header";
import "./globals.css";

// next/font downloads the font at BUILD time and self-hosts it from our own
// domain. Two wins: no network request to Google at runtime (faster, more
// private), and no layout shift, because Next generates matching fallback
// metrics. `variable` exposes the font as a CSS custom property instead of a
// class, so Tailwind can reference it — see the @theme block in globals.css.
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"], // ship only Latin glyphs; smaller file
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Next reads this export and generates the <head> tags for us — we never write
// <title> by hand. Individual pages can export their own `metadata`, or a
// `generateMetadata()` function for dynamic values (see products/[id]).
export const metadata: Metadata = {
  title: "MiniStore",
  description: "A small storefront built with Next.js, Redux, and Storybook",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode; // the current page, injected by Next
}>) {
  return (
    // The font `.variable` classes define the CSS custom properties at the root
    // so every descendant can use them. `antialiased` smooths font rendering.
    <html
      lang="en" // required for screen readers and correct hyphenation
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      {/* min-h-full + flex-col lets a short page still push a footer down. */}
      <body className="min-h-full flex flex-col">
        {/* Providers is a "use client" boundary holding the Redux store.
            Everything inside can call useAppSelector/useAppDispatch; the
            server-rendered children passed through it stay server-rendered. */}
        <Providers>
          <Header />
          {children}
        </Providers>
      </body>
    </html>
  );
}
