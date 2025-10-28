import { PrismaAdapter } from "@auth/prisma-adapter";
import { type DefaultSession, type NextAuthConfig } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import "next-auth/jwt";
import { db } from "@/server/db";
import { UserRole } from "@prisma/client";

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
      role?: UserRole;
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
    DiscordProvider,
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

      // Update session (dari client dengan update() function)
      // if (trigger === "update" && session) {
      //   // Type assertion dengan proper checking
      //   if (session.user) {
      //     token.image = session.user.image ?? token.image;
      //     token.name = session.user.name ?? token.name;
      //     token.email = session.user.email ?? token.email;
      //   }
      // }

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

    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const role = auth?.user?.role;
      const isOnGuruPage = nextUrl.pathname.startsWith("/guru");
      const isOnAdminPage = nextUrl.pathname.startsWith("/admin");

      // Akses halaman /admin
      if (isOnAdminPage) {
        // Hanya ADMIN yang boleh ke /admin (admin juga boleh ke /guru)
        return isLoggedIn && role === UserRole.ADMIN;
      }

      // Akses halaman /guru
      if (isOnGuruPage) {
        // ADMIN dan GURU boleh ke /guru
        return (
          isLoggedIn && (role === UserRole.GURU || role === UserRole.ADMIN)
        );
      }

      return true;
    },
  },
} satisfies NextAuthConfig;
