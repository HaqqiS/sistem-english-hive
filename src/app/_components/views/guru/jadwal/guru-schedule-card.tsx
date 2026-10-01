"use client";

import { StatusKelas } from "@prisma/client";
import { Album, Clock, DoorOpen, User, Users } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
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
import type { TypeScheduleMatrixItem } from "@/types/jadwalKelas.type";
import { formatStatus, statusKelasColorMap } from "@/utils/statusUtils";

interface GuruScheduleCardProps {
	data: TypeScheduleMatrixItem;
	/** "grid" = kartu kecil di matriks (PC), "list" = kartu lebar di timeline (HP) */
	variant?: "grid" | "list";
	/** Nama ruangan, ditampilkan di variant "list" */
	ruang?: string;
}

const borderByStatus: Record<StatusKelas, string> = {
	RUNNING: "border-l-(--badge-running-bg)",
	WAITING: "border-l-(--badge-waiting-bg)",
	TRIAL: "border-l-(--badge-trial-bg)",
	LEVEL_UP: "border-l-(--badge-level-up-bg)",
	COMPLETED: "border-l-(--badge-completed-bg)",
};

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

export function GuruScheduleCard({
	data,
	variant = "grid",
	ruang,
}: GuruScheduleCardProps) {
	const [open, setOpen] = useState(false);
	const status = (data.statusKelas as StatusKelas) ?? StatusKelas.RUNNING;

	// ─── HP: kartu lebar, detail lewat bottom sheet (hover tidak ada di layar sentuh)
	if (variant === "list") {
		return (
			<>
				<button
					type="button"
					onClick={() => setOpen(true)}
					className={cn(
						"bg-card flex w-full flex-col gap-2 rounded-xl border border-l-4 p-3 text-left shadow-sm transition-colors active:bg-muted/50",
						borderByStatus[status],
					)}
				>
					<div className="flex items-start justify-between gap-2">
						<span className="text-sm leading-snug font-bold break-words">
							{data.kodeKelas}
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
					<div className="text-muted-foreground flex items-center gap-1 truncate text-xs">
						<User className="h-3 w-3 shrink-0" />
						<span className="truncate">{data.guru}</span>
					</div>
				</button>

				<Sheet open={open} onOpenChange={setOpen}>
					<SheetContent
						side="bottom"
						className="max-h-[85vh] overflow-y-auto rounded-t-2xl"
					>
						<SheetHeader className="text-left">
							<SheetTitle className="break-words">{data.kodeKelas}</SheetTitle>
							<SheetDescription>Detail jadwal kelas</SheetDescription>
						</SheetHeader>
						<div className="px-4 pb-6">
							<DetailContent data={data} ruang={ruang} />
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
						"bg-card flex w-max min-w-full cursor-pointer flex-col gap-1.5 rounded-lg border border-l-4 p-2.5 shadow-xs transition-all hover:shadow-md",
						borderByStatus[status],
					)}
				>
					<span
						className="text-sm leading-tight font-bold whitespace-nowrap"
						title={data.kodeKelas}
					>
						{data.kodeKelas}
					</span>
					<div className="text-muted-foreground flex flex-col gap-0.5 text-xs">
						<span className="flex items-center gap-1.5">
							<Clock className="h-3 w-3 shrink-0" />
							<span className="font-mono">
								{data.jamMulai} - {data.jamSelesai}
							</span>
						</span>
						<span className="flex items-center gap-1.5">
							<User className="h-3 w-3 shrink-0" />
							<span className="truncate">{data.guru}</span>
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
