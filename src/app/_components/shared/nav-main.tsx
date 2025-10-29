"use client";

import { Folder } from "lucide-react";
import * as Icons from "lucide-react";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import type { NavItem } from "@/types/nav.type";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface NavMainProps {
  // projects: {
  //   title: string;
  //   href: string;
  //   icon: LucideIcon;
  // }[];
  projects: NavItem[];
}
const iconMap = Icons as unknown as Record<string, Icons.LucideIcon>;

export function NavMain({ projects }: NavMainProps) {
  const { isMobile } = useSidebar();
  const pathname = usePathname();

  return (
    <SidebarGroup className="">
      <SidebarGroupLabel>Projects</SidebarGroupLabel>
      <SidebarMenu>
        {projects.map((item) => {
          const IconComponent = iconMap[item.icon] ?? Folder;
          const itemUrlSegments = item.url.split("/").filter(Boolean).length;

          let isActive;

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
                <Link href={item.url}>
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
