import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth from "next-auth";
import type { Adapter } from "next-auth/adapters";
import { cache } from "react";
import { db } from "@/server/db";
import { authConfig } from "./config";

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
