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
	{ title: "Kelas", url: "/admin/kelas", icon: "School" },
];

export default async function AdminLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const session = await auth();
	const isManager = session?.user?.role === UserRole.MANAGER;

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
