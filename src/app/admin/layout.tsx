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
    title: "Kelola Guru",
    url: "/admin/guru",
    icon: "Users",
  },
  {
    title: "Kelola Cabang",
    url: "/admin/cabang",
    icon: "BookCopy",
  },
  {
    title: "Kelola Program Kelas",
    url: "/admin/kelas",
    icon: "Settings",
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
