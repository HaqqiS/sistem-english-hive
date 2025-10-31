import { UserRole } from "@prisma/client";

export const protectedRoutes = [
  { path: "/admin", roles: [UserRole.ADMIN] },
  { path: "/guru", roles: [UserRole.ADMIN, UserRole.GURU] },
];
