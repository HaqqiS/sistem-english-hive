// import { PrismaAdapter } from "@auth/prisma-adapter";
// import { UserRole } from "@prisma/client";

import { compare } from "bcryptjs";
import type { DefaultSession, NextAuthConfig, Session, User } from "next-auth";
import type { JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import { env } from "@/env";
import { UserRole } from "./type";

declare module "next-auth" {
	interface Session extends DefaultSession {
		accessToken?: string;
		user: {
			id: string;
			role?: UserRole;
			name: string;
			email: string;
			image: string | null;
			cabangId?: string;
		} & DefaultSession["user"];
	}

	interface User {
		id?: string;
		email?: string | null;
		name?: string | null;
		image?: string | null;
		role: UserRole;
		cabangId?: string;
		password?: string;
	}
}

declare module "next-auth/jwt" {
	interface JWT {
		id: string;
		name: string;
		email: string;
		image: string | null;
		role: UserRole;
		cabangId?: string;
		accessToken?: string;
	}
}

export const authConfig: NextAuthConfig = {
	// secret: process.env.NEXTAUTH_SECRET,
	secret: env.AUTH_SECRET,
	// adapter: PrismaAdapter(db) as unknown as Adapter,

	session: {
		strategy: "jwt",
		maxAge: 24 * 60 * 60, // 1 hari
	},

	pages: {
		signIn: "/auth/login",
	},

	providers: [
		CredentialsProvider({
			id: "credentials",
			name: "Credentials",
			credentials: {
				email: {
					label: "Email",
					type: "text",
					placeholder: "user@example.com",
				},
				password: { label: "Password", type: "password" },
			},
			async authorize(credentials): Promise<User | null> {
				const { db } = await import("@/server/db");
				const email = credentials?.email as string;
				const password = credentials?.password as string;

				if (!email || !password) {
					throw new Error("Email dan password harus diisi");
				}

				const user = await db.user.findUnique({
					where: { email },
				});

				if (!user) throw new Error("Email atau password salah");
				if (!user.password) throw new Error("Email atau password salah");

				const valid = await compare(password, user.password);
				if (!valid) throw new Error("Email atau password salah");

				// Return sesuai tipe User NextAuth (harus lengkap)
				return {
					id: user.id,
					// biome-ignore lint/style/noNonNullAssertion: guaranteed by database check above
					email: user.email!,
					// biome-ignore lint/style/noNonNullAssertion: guaranteed by database check above
					name: user.name!,
					image: user.image,
					role: user.role as unknown as UserRole,
					cabangId: user.cabangId ?? undefined,
				};
			},
		}),
	],

	callbacks: {
		async jwt({
			token,
			user,
			trigger,
			session,
		}: {
			token: JWT;
			user?: User | undefined;
			trigger?: string | undefined;
			session?: Session | undefined;
		}) {
			if (user) {
				token.id = user.id ?? "";
				token.role = user.role ?? UserRole.GURU;
				token.name = user.name ?? "";
				token.email = user.email ?? "";
				token.image = user.image ?? null;
				token.cabangId = user.cabangId ?? undefined;
			}

			if (trigger === "update" && session?.user) {
				token.name = session.user.name ?? token.name;
				token.email = session.user.email ?? token.email;
				token.image = session.user.image ?? token.image;
				token.cabangId = session.user.cabangId ?? token.cabangId;
			}

			return token;
		},

		async session({ session, token }) {
			if (session.user && token) {
				session.user.id = token.id;
				session.user.role = token.role;
				session.user.name = token.name;
				session.user.email = token.email;
				session.user.image = token.image;
				session.user.cabangId = token.cabangId;
			}
			return session;
		},
	},
};
