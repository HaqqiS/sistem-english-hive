export const protectedRoutes = [
  { path: "/admin", roles: ["ADMIN"] },
  { path: "/guru", roles: ["ADMIN", "GURU"] },
];
