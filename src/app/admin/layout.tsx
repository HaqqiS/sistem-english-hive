import { auth } from "@/server/auth";
import { UserRole } from "@/server/auth/type";
import type { NavCollapsibleItem, NavItem } from "@/types/nav.type";
import DashboardLayout from "../_components/layouts/dashboard-layout";

// Tentukan navigasi khusus untuk ADMIN
const adminNavItems: NavItem[] = [
	{ title: "Dashboard", url: "/admin", icon: "Home" },
	{ title: "Guru", url: "/admin/guru", icon: "Users" },
	{ title: "Murid", url: "/admin/murid", icon: "GraduationCap" },
	{ title: "Pembayaran", url: "/admin/pembayaran", icon: "Banknote" },
	// { title: "Ruangan", url: "/admin/ruang", icon: "Building" },
];

export default async function AdminLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const session = await auth();
	const isManager = session?.user?.role === UserRole.MANAGER;

	//Kelas collapsible
	const kelasItems = [
		{ title: "All Kelas", url: "/admin/kelas", icon: "School" },
		{ title: "Running", url: "/admin/kelas-running", icon: "School" },
		{ title: "Trial", url: "/admin/kelas-trial", icon: "School" },
		{ title: "Waiting", url: "/admin/kelas-waiting", icon: "School" },
	];

	// Navigasi Collapsible (Master Data)
	const masterDataItems = [
		{ title: "Ruang", url: "/admin/ruang", icon: "Building" },
		{ title: "Jam Operasional", url: "/admin/jam", icon: "Clock" },
		{ title: "Jenis Kelas", url: "/admin/jenis-kelas", icon: "School" },
		...(isManager
			? [{ title: "Cabang", url: "/admin/cabang", icon: "MapPin" }]
			: []),
	];

	const adminCollapsibleItems: NavCollapsibleItem[] = [
		{
			title: "Kelas",
			isActive: true,
			items: kelasItems,
		},
		{
			title: "Sub Menu",
			isActive: false,
			items: masterDataItems,
		},
	];

	return (
		<DashboardLayout
			navItems={adminNavItems}
			navCollapsibleItems={adminCollapsibleItems}
		>
			{children}
		</DashboardLayout>
	);
}
