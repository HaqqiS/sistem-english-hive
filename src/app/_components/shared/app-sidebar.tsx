"use client";

import { NavCollapsible } from "@/app/_components/shared/nav-collapsible";
import { NavMain } from "@/app/_components/shared/nav-main";
import { NavUser } from "@/app/_components/shared/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import type { NavItem } from "@/types/nav.type";
import { CabangSwitcher } from "./cabang-switcher";

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  navItems: NavItem[];
}

export function AppSidebar({ navItems, ...props }: AppSidebarProps) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <CabangSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <NavMain projects={navItems} />
        {/* <NavCollapsible items={data.navMain} /> */}
      </SidebarContent>
      <SidebarFooter>
        {/* <NavUser user={data.user} /> */}
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
