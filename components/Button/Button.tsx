// ─── Button ─────────────────────────────────────────────────────────────────
// The app's one button primitive. Note there is NO "use client" here: it has no
// state, no effects, no event handlers of its own, so it renders happily inside
// Server Components. Marking it as a client component would needlessly drag
// every page that uses it toward the client bundle.
//
// (Passing an onClick to it from a client component is fine — the handler lives
// in the caller, which is already a client component.)

import { ButtonHTMLAttributes } from "react";

// Extending the native button's props means our Button accepts
// everything a real <button> does (onClick, disabled, type, aria-*),
// plus our own `variant`. This is the "don't reinvent the wheel" pattern.
//
// The alternative — hand-listing `onClick`, `disabled`, `type`… — guarantees
// you'll eventually need an attribute you forgot. Extending the native type
// means the compiler already knows every valid button attribute.
type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary";
};

export default function Button({
  variant = "primary", // sensible default so most call sites pass nothing
  className = "",
  // The rest operator collects every remaining prop (onClick, disabled, type,
  // aria-label…) so we can forward them untouched to the real <button>.
  ...props
}: ButtonProps) {
  // Styles shared by all variants. `focus:ring-*` keeps a visible keyboard
  // focus indicator — removing outlines without replacing them is one of the
  // most common accessibility regressions. The `disabled:` utilities make the
  // disabled state visible, not just functional.
  const base =
    "px-4 py-2 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

  // A lookup object keyed by variant. Because `variant` is a union type,
  // TypeScript checks that every possible value has an entry here — add
  // "danger" to the union and this object fails to compile until you define it.
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
    secondary:
      "bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-400",
  };
  return (
    <button
      // `className` goes LAST so a caller can override these defaults —
      // in CSS, the later rule of equal specificity wins.
      className={`${base} ${variants[variant]} ${className}`}
      // Spread after className so callers can also override that entirely.
      {...props}
    />
  );
}
