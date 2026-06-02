"use client";

import { StatusKelas } from "@prisma/client";
import {
	Album,
	Clock,
	MoreHorizontal,
	Pencil,
	Trash,
	User,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	HoverCard,
	HoverCardContent,
	HoverCardTrigger,
} from "@/components/ui/hover-card";
import { cn } from "@/lib/utils";
import type {
	TypeJadwalKelas,
	TypeScheduleMatrixItem,
} from "@/types/jadwalKelas.type";
import { formatStatus, statusKelasColorMap } from "@/utils/statusUtils";

interface ScheduleCardProps {
	data: TypeScheduleMatrixItem;
	onDelete: (id: string, kode: string) => void;
	onEdit?: (item: TypeJadwalKelas) => void;
}

export function ScheduleCard({ data, onDelete, onEdit }: ScheduleCardProps) {
	const isPrivate = data.tipeKelas === "PRIVATE";

	// Logic warna berdasarkan Status Kelas (Request User)
	const status = (data.statusKelas as StatusKelas) ?? StatusKelas.RUNNING;

	const cardStyles = cn(
		"border-l-4 shadow-xs transition-colors hover:bg-opacity-20",
		status === StatusKelas.TRIAL &&
			"border-l-(--badge-trial-bg) bg-(--badge-trial-bg)/10 hover:bg-(--badge-trial-bg)/20",
		status === StatusKelas.WAITING &&
			"border-l-(--badge-waiting-bg) bg-(--badge-waiting-bg)/10 hover:bg-(--badge-waiting-bg)/20",
		status === StatusKelas.LEVEL_UP &&
			"border-l-(--badge-level-up-bg) bg-(--badge-level-up-bg)/10 hover:bg-(--badge-level-up-bg)/20",
		status === StatusKelas.COMPLETED &&
			"border-l-(--badge-completed-bg) bg-(--badge-completed-bg)/10 hover:bg-(--badge-completed-bg)/20",
		status === StatusKelas.RUNNING &&
			"border-l-(--badge-running-bg) bg-(--badge-running-bg)/10 hover:bg-(--badge-running-bg)/20",
	);

	const headerColorClass = statusKelasColorMap[status];

	return (
		<HoverCard openDelay={200}>
			<HoverCardTrigger asChild>
				<div
					className={cn(
						"group/card relative flex h-full w-full flex-col justify-between rounded-r-md border border-l-0 p-2.5 text-xs shadow-sm transition-all hover:shadow-md",
						cardStyles,
					)}
				>
					{/* Header Card: Kode Kelas & Actions */}
					<div className="flex items-start justify-between gap-2">
						<Link
							href={`/admin/kelas/detail/${data.kelasId}`}
							className="text-foreground/90 hover:text-primary line-clamp-2 text-base leading-tight font-bold hover:underline"
							title={data.kodeKelas}
						>
							{data.kodeKelas}
						</Link>

						{/* Action Dropdown */}
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									variant="ghost"
									size="icon"
									className="text-muted-foreground hover:text-foreground size-8 shrink-0 opacity-0 transition-opacity group-hover/card:opacity-100 focus:opacity-100"
									onClick={(e) => e.stopPropagation()}
								>
									<MoreHorizontal className="size-5" />
									<span className="sr-only">Menu</span>
								</Button>
							</DropdownMenuTrigger>

							{/* Portal Dropdown ke Body agar tidak tertutup overflow scroll */}
							<DropdownMenuContent
								align="end"
								className="z-50 w-32"
								side="bottom"
								alignOffset={-5}
							>
								<DropdownMenuItem
									onClick={(e) => {
										e.stopPropagation();
										onEdit?.(data.originalData);
									}}
								>
									<Pencil className="mr-2 h-3 w-3" />
									Edit
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuItem
									variant="destructive"
									onClick={(e) => {
										e.stopPropagation();
										onDelete(data.id, data.kodeKelas);
									}}
								>
									<Trash className="mr-2 h-3 w-3" />
									Hapus
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>

					{/* Body Card */}
					<div className="text-muted-foreground mt-2 flex flex-col gap-1 text-[10px]">
						<div className="flex items-center gap-1.5">
							<User className="h-3 w-3 shrink-0 opacity-70" />
							<span className="truncate text-sm font-medium">{data.guru}</span>
						</div>
						<div className="flex items-center gap-1.5">
							<Clock className="h-3 w-3 shrink-0 opacity-70" />
							<span className="font-mono text-sm">
								{data.jamMulai} - {data.jamSelesai}
							</span>
						</div>
						<div className="flex items-center gap-1.5">
							<Album className="h-3 w-3 shrink-0 opacity-70" />
							<span className="font-mono text-sm">{data.deskripsi ?? "-"}</span>
						</div>
					</div>
				</div>
			</HoverCardTrigger>

			{/* HOVER CARD DETAIL */}
			<HoverCardContent
				className="z-50 w-80 overflow-hidden p-0"
				align="start"
				side="right"
				sideOffset={10}
			>
				<div className={cn("h-2 w-full", headerColorClass)} />

				<div className="flex flex-col gap-3 p-4">
					<div className="space-y-1.5">
						<h4 className="text-foreground text-base leading-snug font-bold">
							{data.kodeKelas}
						</h4>
						<div className="flex flex-wrap gap-2">
							<Badge
								variant="secondary"
								className={cn(
									"h-5 border-0 px-1.5 text-[10px] font-normal",
									isPrivate
										? "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300"
										: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
								)}
							>
								{data.tipeKelas}
							</Badge>
							<Badge
								variant="outline"
								className="text-muted-foreground h-5 px-1.5 text-[10px] font-normal"
							>
								{data.jumlahMurid} Siswa Terdaftar
							</Badge>
							<Badge
								variant="outline"
								className={cn(
									"h-5 border-0 px-1.5 text-[10px] font-bold",
									headerColorClass,
								)}
							>
								{formatStatus(status)}
							</Badge>
						</div>
					</div>

					<div className="bg-muted/50 border-border/50 grid grid-cols-1 gap-2 rounded-md border p-3 text-sm">
						<div className="flex items-center justify-between">
							<div className="text-muted-foreground flex items-center gap-2">
								<User className="h-4 w-4" />
								<span className="text-sm">Pengajar</span>
							</div>
							<span className="text-foreground text-sm font-medium">
								{data.guru}
							</span>
						</div>
						<div className="border-border/50 mt-1 flex items-center justify-between border-t pt-2">
							<div className="text-muted-foreground flex items-center gap-2">
								<Clock className="h-4 w-4" />
								<span className="text-sm">Waktu</span>
							</div>
							<span className="text-foreground font-mono text-sm font-medium">
								{data.jamMulai} - {data.jamSelesai}
							</span>
						</div>
						<div className="border-border/50 mt-1 flex items-center justify-between border-t pt-2">
							<div className="text-muted-foreground flex items-center gap-2">
								<Album className="h-4 w-4" />
								<span className="text-sm">Deskripsi</span>
							</div>
							<span className="text-foreground font-mono text-sm font-medium">
								{data.deskripsi ?? "-"}
							</span>
						</div>
					</div>

					<div className="bg-muted/50 border-border/50 grid grid-cols-1 gap-2 rounded-md border p-3 text-sm">
						<div className="flex flex-col gap-2">
							<div className="text-muted-foreground flex items-center gap-2">
								<User className="h-4 w-4" />
								<span className="text-sm">Daftar Murid</span>
							</div>
							<ul className="text-foreground ml-6 list-disc space-y-1 text-xs font-medium">
								{data.originalData.kelas.pendaftaranKelases.length > 0 ? (
									data.originalData.kelas.pendaftaranKelases.map(
										(pendaftaran) => (
											<li key={pendaftaran.id}>
												{pendaftaran.murid.namaLengkap}
											</li>
										),
									)
								) : (
									<li
										key="no-murid"
										className="text-muted-foreground italic list-none"
									>
										Belum ada murid
									</li>
								)}
							</ul>
						</div>
					</div>

					<p className="text-muted-foreground/70 text-center text-[10px] italic">
						Klik menu titik tiga untuk opsi lainnya
					</p>
				</div>
			</HoverCardContent>
		</HoverCard>
	);
}
