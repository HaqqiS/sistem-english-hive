import { UserRole } from "@/server/auth/type";

export const protectedRoutes = [
	{ path: "/admin/cabang", roles: ["MANAGER"] },
	{
		path: "/admin",
		roles: [UserRole.ADMIN, UserRole.MANAGER],
		redirect: "/admin",
	},
	{
		path: "/guru",
		roles: [UserRole.GURU, UserRole.ADMIN, UserRole.MANAGER],
		redirect: "/guru",
	},
];
