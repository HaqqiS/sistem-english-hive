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
import type { NavCollapsibleItem, NavItem } from "@/types/nav.type";
import { CabangSwitcher } from "./cabang-switcher";

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
	navItems: NavItem[];
	navCollapsibleItems?: NavCollapsibleItem[];
}

export function AppSidebar({
	navItems,
	navCollapsibleItems,
	...props
}: AppSidebarProps) {
	return (
		<Sidebar collapsible="icon" {...props}>
			<SidebarHeader>
				<CabangSwitcher />
			</SidebarHeader>
			<SidebarContent className="space-y-0">
				<NavMain projects={navItems} />

				{navCollapsibleItems && navCollapsibleItems.length > 0 && (
					<NavCollapsible items={navCollapsibleItems} />
				)}
			</SidebarContent>
			<SidebarFooter>
				{/* <NavUser user={data.user} /> */}
				<NavUser />
			</SidebarFooter>
			<SidebarRail />
		</Sidebar>
	);
}
