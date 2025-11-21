// import edgeAuth from "@/server/auth/edge-config";

// export default edgeAuth;
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/server/auth";
import { UserRole } from "./server/auth/type";

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware untuk static files dan API routes
  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/api/") ||
    pathname.includes(".") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  try {
    // Get session
    const session = await auth();
    const isLoggedIn = !!session?.user;
    const userRole = session?.user?.role;

    // Remove trailing slash untuk konsistensi
    const cleanPath = pathname.replace(/\/+$/, "");

    // ========================================
    // 1. GUEST ROUTES (/auth/*)
    // ========================================
    if (cleanPath.startsWith("/auth")) {
      if (isLoggedIn) {
        // User sudah login, redirect ke dashboard sesuai role
        const targetUrl =
          userRole === UserRole.ADMIN
            ? "/admin"
            : userRole === UserRole.GURU
              ? "/guru"
              : "/";
        return NextResponse.redirect(new URL(targetUrl, request.url));
      }
      // Belum login, biarkan akses halaman auth
      return NextResponse.next();
    }

    // ========================================
    // 2. PUBLIC ROUTES (Homepage)
    // ========================================
    if (cleanPath === "" || cleanPath === "/") {
      return NextResponse.next();
    }

    // ========================================
    // 3. PROTECTED ROUTES
    // ========================================
    const protectedRoutes = [
      { path: "/admin", roles: ["ADMIN"] },
      { path: "/guru", roles: ["GURU", "ADMIN"] },
    ];

    const matchedRoute = protectedRoutes.find((route) =>
      cleanPath.startsWith(route.path),
    );

    if (matchedRoute) {
      // Route membutuhkan authentication
      if (!isLoggedIn) {
        const loginUrl = new URL("/auth/login", request.url);
        loginUrl.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(loginUrl);
      }

      // Check authorization
      if (userRole && matchedRoute.roles.includes(userRole)) {
        return NextResponse.next();
      }

      // User tidak memiliki role yang tepat, redirect ke dashboard mereka
      const redirectUrl =
        String(userRole) === "ADMIN"
          ? "/admin"
          : String(userRole) === "GURU"
            ? "/guru"
            : "/";
      return NextResponse.redirect(new URL(redirectUrl, request.url));
    }

    // Default: allow access
    return NextResponse.next();
  } catch (error) {
    console.error("Middleware error:", error);
    // Pada error, redirect ke login untuk keamanan
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }
}

export const config = {
  // matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*|api/trpc).*)"],
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|.*\\..*).*)",
    "/api/auth/:path*",
  ],
};
