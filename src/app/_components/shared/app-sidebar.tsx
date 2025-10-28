"use client";

import { NavCollapsible } from "@/app/_components/shared/nav-collapsible";
import { NavMain } from "@/app/_components/shared/nav-main";
import { NavUser } from "@/app/_components/shared/nav-user";
import { TeamSwitcher } from "@/app/_components/shared/team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/app/_components/ui/sidebar";
import type { NavItem } from "@/types/nav.type";
// This is sample data.
import { data } from "@/app/_components/shared/data";

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  navItems: NavItem[];
}

export function AppSidebar({ navItems, ...props }: AppSidebarProps) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
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
