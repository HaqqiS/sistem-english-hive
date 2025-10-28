import { auth } from "@/server/auth";
import { UserRole } from "@prisma/client";

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const role = req.auth?.user?.role;

  // Define protected routes
  const isApiAuthRoute = nextUrl.pathname.startsWith("/api/auth");
  const isPublicRoute =
    nextUrl.pathname === "/" || nextUrl.pathname.startsWith("/auth");
  const isGuruRoute = nextUrl.pathname.startsWith("/guru");
  const isAdminRoute = nextUrl.pathname.startsWith("/admin");

  // Allow auth API routes
  if (isApiAuthRoute) {
    return;
  }

  // Redirect user yang sudah login keluar dari halaman /auth kembali ke dashboard sesuai role
  if (isLoggedIn && isPublicRoute && nextUrl.pathname.startsWith("/auth")) {
    if (role === UserRole.ADMIN) {
      return Response.redirect(new URL("/admin", nextUrl));
    }
    if (role === UserRole.GURU) {
      return Response.redirect(new URL("/guru", nextUrl));
    }
    // fallback ke root
    return Response.redirect(new URL("/", nextUrl));
  }

  /// halaman /admin
  if (isAdminRoute) {
    if (!isLoggedIn || role !== UserRole.ADMIN) {
      return Response.redirect(new URL("/auth/login", nextUrl));
    }
  }

  // halaman /guru
  if (isGuruRoute) {
    if (!isLoggedIn || (role !== UserRole.GURU && role !== UserRole.ADMIN)) {
      return Response.redirect(new URL("/auth/login", nextUrl));
    }
  }
  // Selalu allow halaman lain
  return;
});

/**
 * Matcher configuration
 * Specify which routes should trigger the middleware
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*|api/trpc).*)",
  ],
};
