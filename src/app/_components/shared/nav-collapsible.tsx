"use client";

import * as Icons from "lucide-react";

import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
	SidebarGroup,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSub,
	SidebarMenuSubButton,
	SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import type { NavCollapsibleItem } from "@/types/nav.type";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface NavItemProps {
	items: NavCollapsibleItem[];
}

const iconMap = Icons as unknown as Record<string, Icons.LucideIcon>;

export function NavCollapsible({ items }: NavItemProps) {
	const pathname = usePathname();

	return (
		<SidebarGroup className="pt-0">
			{/* <SidebarGroupLabel>Master Data</SidebarGroupLabel> */}
			<SidebarMenu>
				{items.map((item) => {
					return (
						<Collapsible
							key={item.title}
							asChild
							defaultOpen={item.isActive}
							className="group/collapsible"
						>
							<SidebarMenuItem>
								<CollapsibleTrigger asChild>
									<SidebarMenuButton tooltip={item.title}>
										<span>{item.title}</span>
										<Icons.ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
									</SidebarMenuButton>
								</CollapsibleTrigger>
								<CollapsibleContent>
									<SidebarMenuSub>
										{item.items?.map((subItem) => {
											const IconComponent =
												iconMap[subItem.icon] ?? Icons.Folder;

											const subItemUrlSegments = subItem.url
												.split("/")
												.filter(Boolean).length;

											let isActive;

											if (subItemUrlSegments === 1) {
												// Ini adalah link root (cth: /admin). Gunakan exact match.
												isActive = pathname === subItem.url;
											} else {
												isActive = pathname.startsWith(subItem.url);
											}
											return (
												<SidebarMenuSubItem key={subItem.title}>
													<SidebarMenuSubButton
														asChild
														className={cn(
															isActive &&
																"bg-sidebar-accent text-sidebar-accent-foreground",
														)}
													>
														<Link href={subItem.url}>
															{subItem.icon && <IconComponent />}
															<span>{subItem.title}</span>
														</Link>
													</SidebarMenuSubButton>
												</SidebarMenuSubItem>
											);
										})}
									</SidebarMenuSub>
								</CollapsibleContent>
							</SidebarMenuItem>
						</Collapsible>
					);
				})}
			</SidebarMenu>
			{/* <SidebarMenu>
        {items.map((item) => (
          <Collapsible
            key={item.title}
            asChild
            defaultOpen={item.isActive}
            className="group/collapsible"
          >
            <SidebarMenuItem>
              <SidebarMenuButton tooltip={item.title}>
                {item.icon && <item.icon />}
                <span>{item.title}</span>
                <Icons.ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
              </SidebarMenuButton>
            </SidebarMenuItem>
          </Collapsible>
        ))}
      </SidebarMenu> */}
		</SidebarGroup>
	);
}
