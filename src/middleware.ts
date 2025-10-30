import NextAuth from "next-auth";
import { authConfig } from "@/server/auth";

// Middleware ini hanya menjalankan mekanisme otorisasi dari authConfig.
// Semua logika ada di dalam callback `authorized`.
export default NextAuth(authConfig).auth;

// Matcher ini juga tetap sama.
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*|api/trpc).*)"],
};
