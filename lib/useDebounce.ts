// ─── useDebounce ────────────────────────────────────────────────────────────
// CLIENT-ONLY (it's a hook). Used by the product grid's search box.

import { useEffect, useState } from "react";

// Returns a copy of `value` that only updates after `delay` ms have passed
// with no further changes. For search: we wait until the user stops typing
// instead of filtering on every single keystroke.
//
// Generic in T, so it debounces a string, a number, an object — anything. The
// caller keeps its exact type; there's no `any` anywhere.
//
// Typing "laptop" fires ONE request instead of six. Worth internalising the
// distinction from throttling: debounce waits for the activity to STOP (right
// for search-as-you-type), throttle fires at a steady rate during it (right for
// scroll handlers).
export function useDebounce<T>(value: T, delay = 300): T {
  // Seeded with the initial value so the first render isn't empty.
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);

    // The cleanup cancels the PREVIOUS timer every time `value` changes.
    // So while you're typing, each keystroke clears the last pending timer
    // and starts a fresh one — only the final keystroke's timer survives
    // long enough to fire. That's the entire debounce trick.
    return () => clearTimeout(timer);
  }, [value, delay]); // re-run whenever the input value (or the delay) changes

  return debounced;
}
