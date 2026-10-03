// import { PrismaAdapter } from "@auth/prisma-adapter";
// import { UserRole } from "@prisma/client";

import { compare } from "bcryptjs";
import { headers } from "next/headers";
import type { DefaultSession, NextAuthConfig, Session, User } from "next-auth";
import type { JWT } from "next-auth/jwt";
import Credentials from "next-auth/providers/credentials";
import { RateLimiterMemory } from "rate-limiter-flexible";
import { env } from "@/env";
import { UserRole } from "./type";

const loginRateLimiter = new RateLimiterMemory({
	points: 5, // 5 attempts
	duration: 60 * 15, // 15 minutes
});

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
		Credentials({
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
				const email = (credentials?.email as string | undefined)?.trim();
				const password = credentials?.password as string | undefined;

				if (!email || !password) {
					throw new Error("Email dan password harus diisi");
				}

				// Ambil IP pertama saja (x-forwarded-for bisa berisi "client, proxy1, proxy2").
				const headersList = await headers();
				const ip =
					headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
					"127.0.0.1";

				// Key per IP + email, supaya satu kantor/sekolah (IP sama) tidak saling
				// memblokir login guru lain.
				const limiterKey = `${ip}:${email.toLowerCase()}`;

				try {
					await loginRateLimiter.consume(limiterKey);
				} catch {
					console.error("[auth] login diblokir rate limiter:", limiterKey);
					throw new Error(
						"Terlalu banyak percobaan login. Silakan coba lagi nanti.",
					);
				}

				let user: Awaited<
					ReturnType<typeof import("@/server/db")["db"]["user"]["findUnique"]>
				>;
				try {
					const { db } = await import("@/server/db");
					user = await db.user.findUnique({ where: { email } });
				} catch (error) {
					// Error database/env (mis. DATABASE_URL salah) — jangan sampai terlihat
					// seperti "salah password". Cek log Railway untuk pesan ini.
					console.error("[auth] gagal query database:", error);
					throw new Error("Terjadi kesalahan server");
				}

				if (!user) {
					console.error("[auth] user tidak ditemukan:", email);
					throw new Error("Email atau password salah");
				}
				if (!user.password) {
					console.error("[auth] user tidak punya password:", email);
					throw new Error("Email atau password salah");
				}

				const valid = await compare(password, user.password);
				if (!valid) {
					console.error("[auth] password tidak cocok:", email);
					throw new Error("Email atau password salah");
				}

				// Login berhasil → reset hitungan percobaan untuk key ini.
				await loginRateLimiter.delete(limiterKey);

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
