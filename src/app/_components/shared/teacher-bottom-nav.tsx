"use client";

import { motion } from "framer-motion";
import {
	CalendarDays,
	FileText,
	Home,
	LayoutGrid,
	type LucideIcon,
	Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { NavItem } from "@/types/nav.type";

// Peta nama icon (string di navItems) -> komponen Lucide.
// Kalau nanti ada menu baru dengan icon lain, tinggal tambahkan di sini.
const iconMap: Record<string, LucideIcon> = {
	Home,
	Users,
	CalendarDays,
	LayoutGrid,
	FileText,
};

interface TeacherBottomNavProps {
	navItems: NavItem[];
}

function isItemActive(item: NavItem, pathname: string) {
	return item.url === "/guru"
		? pathname === item.url
		: pathname === item.url || pathname.startsWith(`${item.url}/`);
}

export function TeacherBottomNav({ navItems }: TeacherBottomNavProps) {
	const pathname = usePathname();

	return (
		<nav
			className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] lg:hidden"
			aria-label="Navigasi Dashboard Guru"
		>
			{/* Kapsul mengambang ala tab bar iOS 26 / WhatsApp terbaru:
			    glass-blur, rounded-full, item aktif jadi pill yang meluncur (layoutId).
			    Label tetap tampil di bawah tiap ikon supaya jelas fungsinya. */}
			<div className="border-border/60 bg-background/70 flex items-center gap-1 rounded-[28px] border p-1.5 shadow-[0_8px_30px_-4px_rgba(0,0,0,0.25)] backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
				{navItems.map((item) => {
					const Icon = iconMap[item.icon] ?? Home;
					const isActive = isItemActive(item, pathname);

					return (
						<Link
							key={item.url}
							href={item.url}
							aria-current={isActive ? "page" : undefined}
							className="relative flex items-center"
						>
							{isActive && (
								<motion.span
									layoutId="teacher-bottom-nav-pill"
									transition={{ type: "spring", stiffness: 400, damping: 32 }}
									className="bg-primary absolute inset-0 rounded-3xl"
								/>
							)}
							<span
								className={cn(
									"relative z-10 flex w-16 flex-col items-center justify-center gap-0.5 rounded-3xl px-2 py-1.5 transition-colors",
									isActive
										? "text-primary-foreground"
										: "text-muted-foreground",
								)}
							>
								<Icon className="h-5 w-5 shrink-0" />
								<span className="line-clamp-1 text-center text-[10px] leading-none font-medium">
									{item.title}
								</span>
							</span>
						</Link>
					);
				})}
			</div>
		</nav>
	);
}
