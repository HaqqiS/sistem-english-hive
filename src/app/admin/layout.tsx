import type { NavItem } from "@/types/nav.type";
import { Home, Users, BookCopy, Settings } from "lucide-react"; // Impor ikon yang Anda butuhkan
import { auth } from "@/server/auth"; // Impor fungsi auth dari T3/NextAuth
import { redirect } from "next/navigation";
import DashboardLayout from "../_components/layouts/dashboard-layout";

// Tentukan navigasi khusus untuk ADMIN
const adminNavItems: NavItem[] = [
  {
    title: "Dashboard",
    url: "/admin",
    icon: "Home",
  },
  {
    title: "Manage Users",
    url: "/admin/users",
    icon: "Users",
  },
  {
    title: "Manage Courses",
    url: "/admin/courses",
    icon: "BookCopy",
  },
  {
    title: "Settings",
    url: "/admin/settings",
    icon: "Settings",
    disabled: true, // Contoh link non-aktif
  },
];

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

  return <DashboardLayout navItems={adminNavItems}>{children}</DashboardLayout>;
}
