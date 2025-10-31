import edgeAuth from "@/server/auth/edge-config";

export default edgeAuth;

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*|api/trpc).*)"],
};
