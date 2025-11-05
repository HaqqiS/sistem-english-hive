import { UserRole } from "@/server/auth/type";

export const protectedRoutes = [
  {
    path: "/admin",
    roles: [UserRole.ADMIN],
    redirect: "/admin",
  },
  {
    path: "/guru",
    roles: [UserRole.GURU, UserRole.ADMIN],
    redirect: "/guru",
  },
];
