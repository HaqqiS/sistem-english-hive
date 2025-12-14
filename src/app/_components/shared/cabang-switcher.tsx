"use client";

import { ChevronsUpDown, LayoutDashboard, Lock, Square } from "lucide-react";

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "@/components/ui/sidebar";
import { useGlobalCabangStore } from "@/store/useGlobalCabangStore";
import { useCabang } from "@/hooks/useCabang";
import { useSession } from "next-auth/react";
import { useEffect, useMemo } from "react";
import { UserRole } from "@/server/auth/type";

export function CabangSwitcher() {
	const { isMobile } = useSidebar();
	const { data: session } = useSession();

	const { activeCabangId, setActiveCabangId } = useGlobalCabangStore();
	const { dataList: dataCabang } = useCabang({ enableQueryList: true });

	const userRole = session?.user?.role;
	const userCabangId = session?.user?.cabangId;
	const isManager = userRole === UserRole.MANAGER;

	useEffect(() => {
		if (!isManager && userCabangId && activeCabangId !== userCabangId) {
			setActiveCabangId(userCabangId);
		}
	}, [isManager, userCabangId, activeCabangId, setActiveCabangId]);

	const currentBranchName = useMemo(() => {
		if (activeCabangId === "ALL") return "Semua Cabang";
		const found = dataCabang?.find((c) => c.id === activeCabangId);
		return found ? found.namaCabang : "Cabang Tidak Dikenal";
	}, [activeCabangId, dataCabang]);

	if (!activeCabangId) {
		return null;
	}

	const SwitcherButton = (
		<SidebarMenuButton
			size="lg"
			className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
			// Jika bukan manager, buat cursor default agar tidak terlihat bisa diklik
			style={{ cursor: isManager ? "pointer" : "default" }}
		>
			<div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
				{/* Ganti Logo berdasarkan Status */}
				{activeCabangId === "ALL" ? (
					<Square className="size-4" />
				) : (
					<LayoutDashboard className="size-4" />
				)}
			</div>
			<div className="grid flex-1 text-left text-sm leading-tight">
				<span className="truncate font-medium">{currentBranchName}</span>
				<span className="truncate text-xs">
					{isManager ? "Ganti Cabang" : session?.user?.name}
				</span>
			</div>

			{/* Icon Indikator: Chevron jika Manager, Lock jika Admin/Guru */}
			{isManager ? (
				<ChevronsUpDown className="ml-auto size-4" />
			) : (
				<Lock className="text-muted-foreground ml-auto size-3 opacity-50" />
			)}
		</SidebarMenuButton>
	);

	return (
		<SidebarMenu>
			<SidebarMenuItem>
				{/* LOGIKA RENDERING: */}
				{isManager ? (
					<DropdownMenu>
						<DropdownMenuTrigger asChild>{SwitcherButton}</DropdownMenuTrigger>
						<DropdownMenuContent
							className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
							align="start"
							side={isMobile ? "bottom" : "right"}
							sideOffset={4}
						>
							<DropdownMenuLabel className="text-muted-foreground text-xs">
								Pilih Cabang
							</DropdownMenuLabel>

							{/* Opsi ALL BRANCHES */}
							<DropdownMenuItem
								onClick={() => setActiveCabangId("ALL")}
								className="gap-2 p-2"
							>
								<div className="flex size-6 items-center justify-center rounded-md border">
									<Square className="size-3.5 shrink-0" />
								</div>
								Semua Cabang
							</DropdownMenuItem>

							{/* Opsi List Cabang dari Database */}
							{dataCabang?.map((cabang) => (
								<DropdownMenuItem
									key={cabang.id}
									onClick={() => setActiveCabangId(cabang.id)}
									className="gap-2 p-2"
								>
									<div className="flex size-6 items-center justify-center rounded-md border">
										<LayoutDashboard className="size-3.5 shrink-0" />
									</div>
									{cabang.namaCabang}
								</DropdownMenuItem>
							))}
						</DropdownMenuContent>
					</DropdownMenu>
				) : (
					// Jika BUKAN Manager (Admin/Guru): Render Tombol Mati saja (tanpa Dropdown)
					SwitcherButton
				)}
			</SidebarMenuItem>
		</SidebarMenu>
	);
}
