"use client";

import { Provider } from "react-redux";
import { store } from "./index";

// app/layout.tsx is a Server Component, but Redux's <Provider> needs the
// browser (Context + subscriptions). This "use client" wrapper is the bridge:
// a client boundary we can safely render inside the server layout.
//
// The subtlety worth understanding: "use client" marks a BOUNDARY, not a
// subtree. `children` here are still rendered on the server and passed in as
// already-finished React elements — so wrapping the whole app in this provider
// does NOT turn every page into a client component. That's what makes it safe
// to put at the very top of the tree.
//
// It lives in the layout (rather than in each page) so the store instance
// survives client-side navigation — otherwise the cart would empty every time
// you clicked a link.
export default function Providers({ children }: { children: React.ReactNode }) {
  return <Provider store={store}>{children}</Provider>;
}
