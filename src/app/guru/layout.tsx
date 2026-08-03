import type { NavItem } from "@/types/nav.type";
import DashboardLayout from "../_components/layouts/dashboard-layout";
import { TeacherBottomNav } from "../_components/shared/teacher-bottom-nav";

// Tentukan navigasi khusus untuk Teacher
const teacherNavItems: NavItem[] = [
	{
		title: "Dashboard",
		url: "/guru",
		icon: "Home",
	},
	{
		title: "Absensi Murid",
		url: "/guru/absen",
		icon: "Users",
	},
	{
		title: "Jadwal",
		url: "/guru/jadwal",
		icon: "CalendarDays",
	},
	{
		title: "Grid Jadwal Guru",
		url: "/guru/grid-jadwal",
		icon: "LayoutGrid",
	},
	{ title: "Final Report", url: "/guru/final-report", icon: "FileText" },
];

export default async function TeacherLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	// Ambil sesi di server
	// const session = await auth();
	// Proteksi route: Cek jika user adalah ADMIN
	// if (session?.user?.role !== "ADMIN") {
	//   redirect("/unauthorized"); // atau halaman login
	// }

	return (
		<>
			<DashboardLayout navItems={teacherNavItems} hasBottomNav>
				{children}
			</DashboardLayout>
			<TeacherBottomNav navItems={teacherNavItems} />
		</>
	);
}
