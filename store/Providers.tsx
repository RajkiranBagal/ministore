"use client";

import { Provider } from "react-redux";
import { store } from "./index";

// app/layout.tsx is a Server Component, but Redux's <Provider> needs the
// browser (Context + subscriptions). This "use client" wrapper is the bridge:
// a client boundary we can safely render inside the server layout.
export default function Providers({ children }: { children: React.ReactNode }) {
  return <Provider store={store}>{children}</Provider>;
}
