import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import auth from "@/server/auth/edge-config";
import { UserRole } from "./server/auth/type";

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware untuk static files
  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/api/") ||
    pathname.includes(".") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  try {
    const session = await auth();
    const isLoggedIn = !!session?.user;
    const userRole = session?.user?.role;
    const cleanPath = pathname.replace(/\/+$/, "");

    // Guest routes
    if (cleanPath.startsWith("/auth")) {
      if (isLoggedIn) {
        const targetUrl =
          userRole === UserRole.ADMIN
            ? "/admin"
            : userRole === UserRole.GURU
              ? "/guru"
              : "/";
        return NextResponse.redirect(new URL(targetUrl, request.url));
      }
      return NextResponse.next();
    }

    // Public routes
    if (cleanPath === "" || cleanPath === "/") {
      return NextResponse.next();
    }

    // Protected routes
    const protectedRoutes = [
      { path: "/admin", roles: ["ADMIN", "MANAGER"] },
      { path: "/guru", roles: ["GURU", "ADMIN", "MANAGER"] },
    ];

    const matchedRoute = protectedRoutes.find((route) =>
      cleanPath.startsWith(route.path),
    );

    if (matchedRoute) {
      if (!isLoggedIn) {
        const loginUrl = new URL("/auth/login", request.url);
        loginUrl.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(loginUrl);
      }

      if (userRole && matchedRoute.roles.includes(userRole)) {
        return NextResponse.next();
      }

      const redirectUrl =
        String(userRole) === "MANAGER"
          ? "/admin"
          : String(userRole) === "ADMIN"
            ? "/admin"
            : String(userRole) === "GURU"
              ? "/guru"
              : "/";
      return NextResponse.redirect(new URL(redirectUrl, request.url));
    }

    return NextResponse.next();
  } catch (error) {
    console.error("Middleware error:", error);
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|.*\\..*).*)",
    "/api/auth/:path*",
  ],
};
