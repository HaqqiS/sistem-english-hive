"use client";

import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarRail,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";

export function SidebarMenuSkeleton() {
	return (
		<Sidebar collapsible="icon">
			<SidebarHeader>
				<div className="px-3 py-2">
					<Skeleton className="h-8 w-28 rounded-lg" />
				</div>
			</SidebarHeader>

			<SidebarContent className="space-y-2 px-3">
				{Array.from({ length: 5 }, (_, i) => i).map((index) => (
					<div key={index} className="flex items-center gap-3">
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
