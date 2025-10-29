import type { NavItem } from "@/types/nav.type";
import DashboardLayout from "../_components/layouts/dashboard-layout";

// Tentukan navigasi khusus untuk ADMIN
const adminNavItems: NavItem[] = [
  {
    title: "Dashboard",
    url: "/admin",
    icon: "Home",
  },
  {
    title: "Kelola Guru",
    url: "/admin/guru",
    icon: "Users",
  },
  {
    title: "Kelola Program Kelas",
    url: "/admin/kelas",
    icon: "Settings",
  },
  // {
  //   title: "Kelola Ruang",
  //   url: "/admin/ruang",
  //   icon: "Landmark",
  // },
  {
    title: "Ruangan & Cabang",
    url: "/admin/cabang",
    icon: "Building",
  },
];

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default async function AdminLayout({
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
  // await delay(600000);

  return <DashboardLayout navItems={adminNavItems}>{children}</DashboardLayout>;
}
