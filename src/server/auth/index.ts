import NextAuth from "next-auth";
import { cache } from "react";
import { authConfig } from "./config";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/server/db";
import type { Adapter } from "next-auth/adapters";

const serverAuthConfig = {
  ...authConfig,
  adapter: PrismaAdapter(db) as unknown as Adapter,
};

const {
  auth: uncachedAuth,
  handlers,
  signIn,
  signOut,
} = NextAuth(serverAuthConfig);
// const { auth: uncachedAuth, handlers, signIn, signOut } = NextAuth(authConfig);

export const auth = cache(uncachedAuth);
export { handlers, signIn, signOut, authConfig };
