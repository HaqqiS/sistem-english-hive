import { PrismaAdapter } from "@auth/prisma-adapter";
import { type DefaultSession, type NextAuthConfig } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import "next-auth/jwt";
import { db } from "@/server/db";
import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { protectedRoutes } from "@/constants/routes";

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    accessToken?: string;
    user: {
      id: string;
      role: UserRole;
      name: string;
      email: string;
      image: string | null;
      // ...other properties
      // role: UserRole;
    } & DefaultSession["user"];
  }

  interface User {
    // role?: string;
    // ...other properties
    role?: UserRole;
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

interface SessionUpdate {
  user?: {
    name?: string;
    email?: string;
    role: UserRole;
    image?: string | null;
  };
}

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authConfig = {
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 hari
  },
  pages: {
    signIn: "/auth/login",
  },

  providers: [
    // DiscordProvider,
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
      async authorize(credentials) {
        const { email, password } = credentials as {
          email: string;
          password: string;
        };

        if (!email || !password) {
          throw new Error("Email dan password harus diisi");
        }

        const user = await db.staff.findUnique({
          where: {
            email: email,
          },
        });

        if (!user) {
          throw new Error("Email atau password salah");
        }
        const userPassword = user.password;
        if (!userPassword) {
          throw new Error("Email atau password yang Anda masukkan salah.");
        }

        const isPasswordValid = await compare(password, userPassword);

        if (!isPasswordValid) {
          throw new Error("Email atau password salah");
        }
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
        };
        // const { password, ...userWithoutPassword } = user;
        // return userWithoutPassword;
      },
    }),
  ],
  adapter: PrismaAdapter(db),
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Initial sign in
      if (user) {
        token.id = user.id ?? "";
        token.role = user.role ?? UserRole.GURU;
      }

      if (trigger === "update" && session) {
        const updateData = session as SessionUpdate;

        if (updateData.user) {
          if (updateData.user.name !== undefined) {
            token.name = updateData.user.name;
          }
          if (updateData.user.email !== undefined) {
            token.email = updateData.user.email;
          }
          if (updateData.user.image !== undefined) {
            token.image = updateData.user.image;
          }
        }
      }
      return token;
    },

    // session: ({ session, user }) => ({
    //   ...session,
    //   user: {
    //     ...session.user,
    //     id: user.id,
    //   },
    // }),
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },

    // authorized({ auth, request: { nextUrl } }) {
    //   const isLoggedIn = !!auth?.user;
    //   const role = auth?.user?.role;
    //   const isOnGuruPage = nextUrl.pathname.startsWith("/guru");
    //   const isOnAdminPage = nextUrl.pathname.startsWith("/admin");
    //   const isOnAuthPage = nextUrl.pathname.startsWith("/auth");

    //   // 1. Jika mencoba akses halaman admin
    //   if (isOnAdminPage) {
    //     if (!isLoggedIn) {
    //       // Belum login? Redirect ke login DENGAN callbackUrl
    //       const loginUrl = new URL("/auth/login", nextUrl);
    //       loginUrl.searchParams.set(
    //         "callbackUrl",
    //         nextUrl.pathname + nextUrl.search,
    //       );
    //       return Response.redirect(loginUrl); // <-- Gunakan NextResponse
    //     }
    //     if (role !== "ADMIN") {
    //       return false; // Biarkan admin di halaman admin
    //     }
    //     return true; // User adalah admin, izinkan akses
    //   }

    //   // 2. Jika mencoba akses halaman guru
    //   if (isOnGuruPage) {
    //     if (!isLoggedIn) {
    //       // Belum login? Redirect ke login DENGAN callbackUrl
    //       const loginUrl = new URL("/auth/login", nextUrl);
    //       loginUrl.searchParams.set(
    //         "callbackUrl",
    //         nextUrl.pathname + nextUrl.search,
    //       );
    //       return Response.redirect(loginUrl);
    //     }
    //     if (role !== "GURU" && role !== "ADMIN") {
    //       // Bukan guru atau admin? Redirect ke unauthorized
    //       return Response.redirect(new URL("/unauthorized", nextUrl));
    //     }
    //     return true; // User adalah guru atau admin, izinkan akses
    //   }

    //   // 3. Jika SUDAH login TAPI mencoba akses halaman /auth/*
    //   if (isLoggedIn && isOnAuthPage) {
    //     // Redirect ke dashboard sesuai role
    //     if (role === "ADMIN")
    //       return Response.redirect(new URL("/admin", nextUrl));
    //     if (role === "GURU")
    //       return Response.redirect(new URL("/guru", nextUrl));
    //     // Fallback jika role lain
    //     return Response.redirect(new URL("/", nextUrl));
    //   }

    //   // 4. Untuk halaman publik lainnya, selalu izinkan
    //   return true;
    // },

    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const userRole = auth?.user?.role;
      const { pathname } = nextUrl;

      // 1. Cek apakah rute yang diminta ada dalam daftar rute yang dilindungi
      // Urutkan berdasarkan panjang path (desc) untuk memastikan '/admin/cabang' dicek sebelum '/admin'
      const sortedProtectedRoutes = [...protectedRoutes].sort(
        (a, b) => b.path.length - a.path.length,
      );
      const routeRule = sortedProtectedRoutes.find((rule) =>
        pathname.startsWith(rule.path),
      );

      // Jika rute TIDAK DILINDUNGI (seperti '/' atau '/about'), izinkan akses
      if (!routeRule) {
        return true;
      }

      // --- LOGIKA UNTUK RUTE YANG DILINDUNGI ---

      // 2. Jika pengguna BELUM LOGIN, lempar ke halaman login
      if (!isLoggedIn) {
        const loginUrl = new URL("/auth/login", nextUrl);
        const callbackPath = nextUrl.pathname + nextUrl.search;
        loginUrl.searchParams.set("callbackUrl", callbackPath);
        return NextResponse.redirect(loginUrl);
      }

      // 3. Jika pengguna SUDAH LOGIN, cek perannya
      if (userRole && routeRule.roles.includes(userRole)) {
        // Pengguna memiliki peran yang diizinkan, izinkan akses
        return true;
      }

      // 4. Jika pengguna SUDAH LOGIN tapi TIDAK PUNYA AKSES
      // (Contoh: GURU mencoba akses /admin)
      // Lempar mereka ke dashboard mereka sendiri sebagai fallback
      if (userRole === "GURU") {
        return NextResponse.redirect(new URL("/guru", nextUrl));
      }

      // Fallback untuk kasus lain (misal, tidak ada peran), lempar ke halaman unauthorized atau login
      return NextResponse.redirect(new URL("/auth/login", nextUrl));
    },
  },
} satisfies NextAuthConfig;
