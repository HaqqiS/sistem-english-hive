import type { NavItem } from "@/types/nav.type";
import DashboardLayout from "../_components/layouts/dashboard-layout";
import { HydrateClient } from "@/trpc/server";

// Tentukan navigasi khusus untuk ADMIN
const adminNavItems: NavItem[] = [
  { title: "Dashboard", url: "/admin", icon: "Home" },
  { title: "Kelola Guru", url: "/admin/guru", icon: "Users" },
  { title: "Kelola Program Kelas", url: "/admin/kelas", icon: "Settings" },
  { title: "Ruangan & Cabang", url: "/admin/cabang", icon: "Building" },
];

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // await delay(600000);
  return (
    <DashboardLayout navItems={adminNavItems}>
      <HydrateClient>{children}</HydrateClient>
    </DashboardLayout>
  );

  // return (
  //   <Suspense fallback={<AdminLoading />}>
  //     <DashboardLayout navItems={adminNavItems}>{children}</DashboardLayout>
  //   </Suspense>
  // );
}
