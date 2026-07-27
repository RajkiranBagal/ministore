import { DefaultSession } from "next-auth";

// We added a custom `id` to the session user and JWT in auth.ts's callbacks.
// These declarations tell TypeScript about them, so `session.user.id` is typed.
declare module "next-auth" {
  interface Session {
    user: { id: string } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
  }
}
