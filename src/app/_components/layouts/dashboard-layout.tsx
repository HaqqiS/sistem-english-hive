"use client";
import { AppSidebar } from "@/app/_components/shared/app-sidebar";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import type { NavItem } from "@/types/nav.type";
import { DynamicBreadcrumb } from "../shared/dynamic-breadcrumb";

interface DashboardLayoutProps {
  children: React.ReactNode;
  navItems: NavItem[];
  // Anda bisa tambahkan props lain jika perlu
  // userNavItems: UserNavItem[];
  // teamSwitcherItems: TeamSwitcherItem[];
}

export default function DashboardLayout({
  children,
  navItems,
}: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      {/* <AppSidebar /> */}
      <AppSidebar navItems={navItems} />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />

            <DynamicBreadcrumb />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
