import { handlers } from "@/auth";

// Auth.js generates all its endpoints (signin, signout, session, csrf…)
// behind this one catch-all route. We just re-export its GET/POST handlers.
export const { GET, POST } = handlers;
