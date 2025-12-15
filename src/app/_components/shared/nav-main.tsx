"use client";

import * as Icons from "lucide-react";
import { Folder } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
	SidebarGroup,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import type { NavItem } from "@/types/nav.type";

interface NavMainProps {
	projects: NavItem[];
}
const iconMap = Icons as unknown as Record<string, Icons.LucideIcon>;

export function NavMain({ projects }: NavMainProps) {
	const { isMobile, setOpenMobile } = useSidebar();
	const pathname = usePathname();

	return (
		<SidebarGroup className="pb-0">
			<SidebarGroupLabel>Main</SidebarGroupLabel>
			<SidebarMenu>
				{projects.map((item) => {
					const IconComponent = iconMap[item.icon] ?? Folder;
					const itemUrlSegments = item.url.split("/").filter(Boolean).length;

					let isActive: boolean;

					if (itemUrlSegments === 1) {
						// Ini adalah link root (cth: /admin). Gunakan exact match.
						isActive = pathname === item.url;
					} else {
						// Ini adalah link sub-halaman (cth: /admin/kelas).
						// Gunakan startsWith untuk menangani dynamic routes (cth: /admin/users/123)
						isActive = pathname.startsWith(item.url);
					}

					return (
						<SidebarMenuItem key={item.title}>
							<SidebarMenuButton
								asChild
								className={cn(
									isActive &&
										"bg-sidebar-accent text-sidebar-accent-foreground",
								)}
							>
								<Link
									href={item.url}
									onClick={() => {
										if (isMobile) setOpenMobile(false);
									}}
								>
									<IconComponent />
									<span>{item.title}</span>
								</Link>
							</SidebarMenuButton>
						</SidebarMenuItem>
					);
				})}
			</SidebarMenu>
		</SidebarGroup>
	);
}
