import { PrismaAdapter } from "@auth/prisma-adapter";
import {
  type DefaultSession,
  type NextAuthConfig,
  type User,
  type Session,
} from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import type { JWT } from "next-auth/jwt";
import { db } from "@/server/db";
import { NextResponse } from "next/server";
import { protectedRoutes } from "@/constants/routes";
// import { UserRole } from "@prisma/client";
import type { Adapter } from "next-auth/adapters";
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
    } & DefaultSession["user"];
  }

  interface User {
    id?: string;
    email?: string | null;
    name?: string | null;
    image?: string | null;
    role: UserRole;
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
    accessToken?: string;
  }
}

export const authConfig: NextAuthConfig = {
  secret: process.env.NEXTAUTH_SECRET,
  adapter: PrismaAdapter(db) as unknown as Adapter,

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
          email: user.email!,
          name: user.name!,
          image: user.image,
          role: user.role as unknown as UserRole,
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
      }

      if (trigger === "update" && session?.user) {
        token.name = session.user.name ?? token.name;
        token.email = session.user.email ?? token.email;
        token.image = session.user.image ?? token.image;
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
      }
      return session;
    },

    /**
     * `authorized` hanya dipanggil di edge runtime (middleware)
     */
    // authorized({ auth, request: { nextUrl } }) {
    //   const isLoggedIn = !!auth?.user;
    //   const role = auth?.user.role;
    //   const pathname = nextUrl.pathname.replace(/\/+$/, ""); // hapus trailing slash

    //   const sortedRoutes = [...protectedRoutes].sort(
    //     (a, b) => b.path.length - a.path.length,
    //   );

    //   const routeRule = sortedRoutes.find(
    //     (r) => pathname === r.path || pathname.startsWith(`${r.path}/`),
    //   );

    //   if (isLoggedIn && pathname === "/auth/login") {
    //     return NextResponse.redirect(new URL("/", nextUrl));
    //   }
    //   if (!routeRule) return true;

    //   if (!isLoggedIn) {
    //     const loginUrl = new URL("/auth/login", nextUrl);
    //     loginUrl.searchParams.set("callbackUrl", pathname + nextUrl.search);
    //     return NextResponse.redirect(loginUrl);
    //   }

    //   if (role && routeRule.roles.includes(role)) return true;

    //   if (role === UserRole.GURU)
    //     return NextResponse.redirect(new URL("/guru", nextUrl));

    //   return NextResponse.redirect(new URL("/auth/login", nextUrl));
    // },
    // authorized({ auth, request: { nextUrl } }) {
    //   const isLoggedIn = !!auth?.user;
    //   const role = auth?.user?.role;
    //   const pathname = nextUrl.pathname.replace(/\/+$/, "");

    //   // Guest restriction: /auth/*
    //   if (pathname.startsWith("/auth")) {
    //     if (isLoggedIn) {
    //       const target =
    //         role === UserRole.ADMIN
    //           ? "/admin"
    //           : role === UserRole.GURU
    //             ? "/guru"
    //             : "/";
    //       return NextResponse.redirect(new URL(target, nextUrl));
    //     }
    //     return true;
    //   }

    //   // Public routes
    //   if (pathname === "/") return true;

    //   // Proteksi route
    //   const matched = protectedRoutes.find((r) => pathname.startsWith(r.path));
    //   if (!matched) return true;

    //   if (!isLoggedIn) {
    //     const loginUrl = new URL("/auth/login", nextUrl);
    //     loginUrl.searchParams.set(
    //       "callbackUrl",
    //       nextUrl.pathname + nextUrl.search,
    //     );
    //     return NextResponse.redirect(loginUrl);
    //   }

    //   if (role && matched.roles.includes(role)) return true;

    //   // Salah role → redirect ke dashboard role-nya
    //   const redirectUrl =
    //     role === UserRole.ADMIN
    //       ? "/admin"
    //       : role === UserRole.GURU
    //         ? "/guru"
    //         : "/";
    //   return NextResponse.redirect(new URL(redirectUrl, nextUrl));
    // },
  },
};
