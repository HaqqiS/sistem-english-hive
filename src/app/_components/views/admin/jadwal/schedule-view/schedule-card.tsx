"use client";

import { StatusKelas } from "@prisma/client";
import {
	Album,
	Clock,
	DoorOpen,
	ExternalLink,
	MoreHorizontal,
	Pencil,
	Trash,
	User,
	Users,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
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
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
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
	/** "grid" = kartu kecil di matriks (PC), "list" = kartu lebar di timeline (HP) */
	variant?: "grid" | "list";
	/** Nama ruangan, ditampilkan di detail dan variant "list" */
	ruang?: string;
}

const borderByStatus: Record<StatusKelas, string> = {
	RUNNING: "border-l-(--badge-running-bg)",
	WAITING: "border-l-(--badge-waiting-bg)",
	TRIAL: "border-l-(--badge-trial-bg)",
	LEVEL_UP: "border-l-(--badge-level-up-bg)",
	COMPLETED: "border-l-(--badge-completed-bg)",
};

function ActionMenu({
	data,
	onDelete,
	onEdit,
	className,
}: Pick<ScheduleCardProps, "data" | "onDelete" | "onEdit"> & {
	className?: string;
}) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="ghost"
					size="icon"
					className={cn(
						"text-muted-foreground hover:text-foreground size-8 shrink-0",
						className,
					)}
					onClick={(e) => e.stopPropagation()}
				>
					<MoreHorizontal className="size-5" />
					<span className="sr-only">Menu</span>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				align="end"
				className="z-50 w-36"
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
	);
}

function DetailContent({
	data,
	ruang,
}: {
	data: TypeScheduleMatrixItem;
	ruang?: string;
}) {
	const status = (data.statusKelas as StatusKelas) ?? StatusKelas.RUNNING;
	const isPrivate = data.tipeKelas === "PRIVATE";
	const murid = data.originalData.kelas.pendaftaranKelases;

	return (
		<div className="flex flex-col gap-3">
			<div className="flex flex-wrap gap-1.5">
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
					className={cn(
						"h-5 border-0 px-1.5 text-[10px] font-bold",
						statusKelasColorMap[status],
					)}
				>
					{formatStatus(status)}
				</Badge>
				<Badge
					variant="outline"
					className="text-muted-foreground h-5 px-1.5 text-[10px] font-normal"
				>
					{data.jumlahMurid} siswa
				</Badge>
			</div>

			<dl className="bg-muted/40 divide-y rounded-lg border text-sm">
				<div className="flex items-center justify-between gap-3 px-3 py-2">
					<dt className="text-muted-foreground flex items-center gap-2">
						<User className="h-4 w-4" /> Pengajar
					</dt>
					<dd className="text-right font-medium">{data.guru}</dd>
				</div>
				<div className="flex items-center justify-between gap-3 px-3 py-2">
					<dt className="text-muted-foreground flex items-center gap-2">
						<Clock className="h-4 w-4" /> Waktu
					</dt>
					<dd className="font-mono font-medium">
						{data.jamMulai} - {data.jamSelesai}
					</dd>
				</div>
				{ruang && (
					<div className="flex items-center justify-between gap-3 px-3 py-2">
						<dt className="text-muted-foreground flex items-center gap-2">
							<DoorOpen className="h-4 w-4" /> Ruangan
						</dt>
						<dd className="font-medium">{ruang}</dd>
					</div>
				)}
				<div className="flex items-center justify-between gap-3 px-3 py-2">
					<dt className="text-muted-foreground flex items-center gap-2">
						<Album className="h-4 w-4" /> Deskripsi
					</dt>
					<dd className="text-right font-medium">{data.deskripsi ?? "-"}</dd>
				</div>
			</dl>

			<div className="bg-muted/40 rounded-lg border p-3">
				<div className="text-muted-foreground mb-2 flex items-center gap-2 text-sm">
					<Users className="h-4 w-4" /> Daftar Murid
				</div>
				{murid.length > 0 ? (
					<ul className="grid grid-cols-1 gap-1 text-sm font-medium sm:grid-cols-2">
						{murid.map((p) => (
							<li key={p.id} className="truncate">
								{p.murid.namaLengkap}
							</li>
						))}
					</ul>
				) : (
					<p className="text-muted-foreground text-sm italic">
						Belum ada murid
					</p>
				)}
			</div>
		</div>
	);
}

export function ScheduleCard({
	data,
	onDelete,
	onEdit,
	variant = "grid",
	ruang,
}: ScheduleCardProps) {
	const [open, setOpen] = useState(false);
	const status = (data.statusKelas as StatusKelas) ?? StatusKelas.RUNNING;

	// ─── HP: kartu lebar, detail lewat bottom sheet (hover tidak ada di layar sentuh)
	if (variant === "list") {
		return (
			<>
				<div className="relative">
					<button
						type="button"
						onClick={() => setOpen(true)}
						className={cn(
							"bg-card active:bg-muted/50 flex w-full flex-col gap-2 rounded-xl border border-l-4 p-3 pr-11 text-left shadow-sm transition-colors",
							borderByStatus[status],
						)}
					>
						<span className="text-sm leading-snug font-bold break-words">
							{data.kodeKelas}
						</span>
						<div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
							<span className="flex items-center gap-1">
								<Clock className="h-3 w-3" />
								<span className="font-mono">
									{data.jamMulai} - {data.jamSelesai}
								</span>
							</span>
							{ruang && (
								<span className="flex items-center gap-1">
									<DoorOpen className="h-3 w-3" />
									{ruang}
								</span>
							)}
							<span className="flex items-center gap-1">
								<Users className="h-3 w-3" />
								{data.jumlahMurid} siswa
							</span>
						</div>
						<div className="flex items-center justify-between gap-2">
							<span className="text-muted-foreground flex min-w-0 items-center gap-1 text-xs">
								<User className="h-3 w-3 shrink-0" />
								<span className="truncate">{data.guru}</span>
							</span>
							<Badge
								variant="outline"
								className={cn(
									"h-5 shrink-0 px-1.5 text-[10px] font-bold",
									statusKelasColorMap[status],
								)}
							>
								{formatStatus(status)}
							</Badge>
						</div>
					</button>
					<ActionMenu
						data={data}
						onDelete={onDelete}
						onEdit={onEdit}
						className="absolute top-1 right-1"
					/>
				</div>

				<Sheet open={open} onOpenChange={setOpen}>
					<SheetContent
						side="bottom"
						className="max-h-[85vh] overflow-y-auto rounded-t-2xl"
					>
						<SheetHeader className="text-left">
							<SheetTitle className="break-words">{data.kodeKelas}</SheetTitle>
							<SheetDescription>Detail jadwal kelas</SheetDescription>
						</SheetHeader>
						<div className="flex flex-col gap-3 px-4 pb-6">
							<DetailContent data={data} ruang={ruang} />
							<div className="grid grid-cols-3 gap-2">
								<Button variant="outline" size="sm" asChild>
									<Link href={`/admin/kelas/detail/${data.kelasId}`}>
										<ExternalLink className="mr-1.5 h-3.5 w-3.5" />
										Detail
									</Link>
								</Button>
								<Button
									variant="outline"
									size="sm"
									onClick={() => {
										setOpen(false);
										onEdit?.(data.originalData);
									}}
								>
									<Pencil className="mr-1.5 h-3.5 w-3.5" />
									Edit
								</Button>
								<Button
									variant="outline"
									size="sm"
									className="text-destructive"
									onClick={() => {
										setOpen(false);
										onDelete(data.id, data.kodeKelas);
									}}
								>
									<Trash className="mr-1.5 h-3.5 w-3.5" />
									Hapus
								</Button>
							</div>
						</div>
					</SheetContent>
				</Sheet>
			</>
		);
	}

	// ─── PC: kartu ringkas di matriks, detail lewat hover
	return (
		<HoverCard openDelay={200}>
			<HoverCardTrigger asChild>
				<div
					className={cn(
						"group/card bg-card flex w-max min-w-full flex-col gap-1.5 rounded-lg border border-l-4 p-2.5 shadow-xs transition-all hover:shadow-md",
						borderByStatus[status],
					)}
				>
					<div className="flex items-start justify-between gap-2">
						<Link
							href={`/admin/kelas/detail/${data.kelasId}`}
							className="hover:text-primary text-sm leading-tight font-bold whitespace-nowrap hover:underline"
							title={data.kodeKelas}
						>
							{data.kodeKelas}
						</Link>
						<ActionMenu
							data={data}
							onDelete={onDelete}
							onEdit={onEdit}
							className="-mt-1.5 -mr-1.5 size-7 opacity-0 transition-opacity group-hover/card:opacity-100 focus:opacity-100 data-[state=open]:opacity-100"
						/>
					</div>
					<div className="text-muted-foreground flex flex-col gap-0.5 text-xs">
						<span className="flex items-center gap-1.5">
							<Clock className="h-3 w-3 shrink-0" />
							<span className="font-mono">
								{data.jamMulai} - {data.jamSelesai}
							</span>
						</span>
						<span className="flex items-center gap-1.5">
							<User className="h-3 w-3 shrink-0" />
							<span>{data.guru}</span>
						</span>
					</div>
					<div className="flex items-center justify-between gap-2 pt-0.5">
						<Badge
							variant="outline"
							className={cn(
								"h-4 px-1.5 text-[10px] font-bold",
								statusKelasColorMap[status],
							)}
						>
							{formatStatus(status)}
						</Badge>
						<span className="text-muted-foreground flex items-center gap-1 text-[11px]">
							<Users className="h-3 w-3" />
							{data.jumlahMurid}
						</span>
					</div>
				</div>
			</HoverCardTrigger>

			<HoverCardContent
				className="z-50 w-80 p-4"
				align="start"
				side="right"
				sideOffset={10}
			>
				<h4 className="mb-2 text-base leading-snug font-bold">
					{data.kodeKelas}
				</h4>
				<DetailContent data={data} ruang={ruang} />
			</HoverCardContent>
		</HoverCard>
	);
}
