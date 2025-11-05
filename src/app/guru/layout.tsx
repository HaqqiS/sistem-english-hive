import type { NavItem } from "@/types/nav.type";
import { Home, Users, BookCopy, Settings } from "lucide-react"; // Impor ikon yang Anda butuhkan
import { auth } from "@/server/auth"; // Impor fungsi auth dari T3/NextAuth
import { redirect } from "next/navigation";
import DashboardLayout from "../_components/layouts/dashboard-layout";

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
    <DashboardLayout navItems={teacherNavItems}> {children} </DashboardLayout>
  );
}
