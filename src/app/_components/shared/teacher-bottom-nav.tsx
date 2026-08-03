"use client";

import { AnimatePresence, motion } from "framer-motion";
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

	// Cari index item yang lagi aktif (default ke index tengah kalau tidak ketemu)
	const centerIndex = Math.floor(navItems.length / 2);
	const activeIndex = navItems.findIndex((item) =>
		isItemActive(item, pathname),
	);
	const resolvedActiveIndex = activeIndex === -1 ? centerIndex : activeIndex;

	// Susun ulang urutan tampilan: item aktif ditukar posisinya ke tengah,
	// item yang tadinya di tengah pindah ke posisi item aktif.
	const displayItems = [...navItems];
	if (resolvedActiveIndex !== centerIndex) {
		const temp = displayItems[centerIndex];
		displayItems[centerIndex] = displayItems[resolvedActiveIndex]!;
		displayItems[resolvedActiveIndex] = temp!;
	}

	return (
		<nav
			className="bg-background/95 fixed inset-x-0 bottom-0 z-50 border-t backdrop-blur-md lg:hidden"
			aria-label="Navigasi Dashboard Guru"
		>
			<div
				className="relative grid h-16 w-full items-center pb-[env(safe-area-inset-bottom)]"
				style={{
					gridTemplateColumns: `repeat(${displayItems.length}, minmax(0, 1fr))`,
				}}
			>
				<AnimatePresence initial={false}>
					{displayItems.map((item, index) => {
						const Icon = iconMap[item.icon] ?? Home;
						const isActive = isItemActive(item, pathname);
						const isCenter = index === centerIndex;

						return (
							<motion.div
								key={item.url}
								layout
								layoutId={item.url}
								transition={{
									type: "spring",
									stiffness: 350,
									damping: 28,
								}}
								className="relative flex h-full items-center justify-center"
							>
								<Link
									href={item.url}
									className="relative flex h-full w-full flex-col items-center justify-center gap-1 px-1 text-center"
								>
									{isCenter ? (
										// Item tengah: bulat, terangkat, lebih besar
										<motion.div
											layout
											className={cn(
												"flex flex-col items-center justify-center gap-1",
											)}
										>
											<span
												className={cn(
													"flex h-12 w-12 -translate-y-4 items-center justify-center rounded-full shadow-lg ring-4 ring-background transition-colors",
													isActive
														? "bg-primary text-primary-foreground"
														: "bg-muted text-muted-foreground",
												)}
											>
												<Icon className="h-6 w-6" />
											</span>
											<span
												className={cn(
													"-mt-3 line-clamp-1 text-[10px] leading-none font-semibold transition-colors",
													isActive ? "text-primary" : "text-muted-foreground",
												)}
											>
												{item.title}
											</span>
										</motion.div>
									) : (
										// Item biasa: ukuran normal
										<>
											<Icon
												className={cn(
													"h-5 w-5 transition-colors",
													isActive ? "text-primary" : "text-muted-foreground",
												)}
											/>
											<span
												className={cn(
													"line-clamp-1 text-[10px] leading-none font-medium transition-colors",
													isActive ? "text-primary" : "text-muted-foreground",
												)}
											>
												{item.title}
											</span>
										</>
									)}
								</Link>
							</motion.div>
						);
					})}
				</AnimatePresence>
			</div>
		</nav>
	);
}
