import type { NavItem } from "@/types/nav.type";
import DashboardLayout from "../_components/layouts/dashboard-layout";

// Tentukan navigasi khusus untuk ADMIN
const adminNavItems: NavItem[] = [
  { title: "Dashboard", url: "/admin", icon: "Home" },
  { title: "Verifikasi Absen Guru", url: "/admin/absen", icon: "Users" },
  { title: "Sesi Pertemuan Kelas", url: "/admin/sesi", icon: "Calendar" },
  { title: "Program Kelas", url: "/admin/kelas", icon: "School" },
  { title: "Ruangan & Cabang", url: "/admin/cabang", icon: "Building" },
];

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // await delay(600000);
  return <DashboardLayout navItems={adminNavItems}>{children}</DashboardLayout>;

  // return (
  //   <Suspense fallback={<AdminLoading />}>
  //     <DashboardLayout navItems={adminNavItems}>{children}</DashboardLayout>
  //   </Suspense>
  // );
}
