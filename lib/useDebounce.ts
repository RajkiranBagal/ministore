import { useEffect, useState } from "react";

// Returns a copy of `value` that only updates after `delay` ms have passed
// with no further changes. For search: we wait until the user stops typing
// instead of filtering on every single keystroke.
export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);

    // The cleanup cancels the PREVIOUS timer every time `value` changes.
    // So while you're typing, each keystroke clears the last pending timer
    // and starts a fresh one — only the final keystroke's timer survives
    // long enough to fire. That's the entire debounce trick.
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
