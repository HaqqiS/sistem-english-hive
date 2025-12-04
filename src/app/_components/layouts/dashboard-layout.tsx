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
import { Suspense } from "react";
import { SidebarMenuSkeleton } from "../shared/sidebar-menu-skeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

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
      {/* <AppSidebar navItems={navItems} /> */}
      <Suspense fallback={<SidebarMenuSkeleton />}>
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <AppSidebar navItems={navItems} />
        </motion.div>
      </Suspense>

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
          <div
            id="header-actions"
            className="mr-4 ml-auto flex items-center gap-2 px-4"
          />
        </header>
        <Suspense
          fallback={
            <div className="flex flex-col gap-4 p-4">
              <Skeleton className="h-8 w-40" />
              <Skeleton className="h-6 w-80" />
              <Skeleton className="h-64 w-full" />
            </div>
          }
        >
          <div className="flex flex-1 flex-col gap-4 p-2 lg:p-4 lg:pt-0">
            <motion.div
              className="flex flex-1 flex-col gap-4 p-2 lg:p-4 lg:pt-0"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
            >
              {children}
            </motion.div>
          </div>
        </Suspense>
      </SidebarInset>
    </SidebarProvider>
  );
}
