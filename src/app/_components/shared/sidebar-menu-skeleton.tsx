"use client";

import { Skeleton } from "@/components/ui/skeleton";
import {
	Sidebar,
	SidebarContent,
	SidebarHeader,
	SidebarFooter,
	SidebarRail,
} from "@/components/ui/sidebar";

export function SidebarMenuSkeleton() {
	return (
		<Sidebar collapsible="icon">
			<SidebarHeader>
				<div className="px-3 py-2">
					<Skeleton className="h-8 w-28 rounded-lg" />
				</div>
			</SidebarHeader>

			<SidebarContent className="space-y-2 px-3">
				{Array.from({ length: 5 }).map((_, i) => (
					<div key={i} className="flex items-center gap-3">
						<Skeleton className="h-5 w-5 rounded-md" />
						<Skeleton className="h-5 w-24 rounded-md" />
					</div>
				))}
			</SidebarContent>

			<SidebarFooter>
				<div className="px-3 pb-3">
					<Skeleton className="h-8 w-full rounded-lg" />
				</div>
			</SidebarFooter>

			<SidebarRail />
		</Sidebar>
	);
}
