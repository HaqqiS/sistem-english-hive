"use client";

import { Album, Clock, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
	HoverCard,
	HoverCardContent,
	HoverCardTrigger,
} from "@/components/ui/hover-card";
import { cn } from "@/lib/utils";
import type { TypeScheduleMatrixItem } from "@/types/jadwalKelas.type";

interface GuruScheduleCardProps {
	data: TypeScheduleMatrixItem;
}

export function GuruScheduleCard({ data }: GuruScheduleCardProps) {
	const isPrivate = data.tipeKelas === "PRIVATE";

	// Logic warna berdasarkan Status Kelas (Request User)
	let cardStyles = "";
	let headerColorClass = "";
	const status = data.statusKelas ?? "RUNNING"; // Default fallback

	switch (status) {
		case "TRIAL":
			cardStyles =
				"border-l-4 border-l-purple-500 bg-purple-50/50 hover:bg-purple-100/50 dark:bg-purple-900/10 dark:hover:bg-purple-900/20";
			headerColorClass = "bg-purple-500";
			break;
		case "WAITING":
			cardStyles =
				"border-l-4 border-l-yellow-500 bg-yellow-50/50 hover:bg-yellow-100/50 dark:bg-yellow-900/10 dark:hover:bg-yellow-900/20";
			headerColorClass = "bg-yellow-500";
			break;
		case "LEVEL_UP":
			cardStyles =
				"border-l-4 border-l-teal-500 bg-teal-50/50 hover:bg-teal-100/50 dark:bg-teal-900/10 dark:hover:bg-teal-900/20";
			headerColorClass = "bg-teal-500";
			break;
		case "COMPLETED":
			cardStyles =
				"border-l-4 border-l-slate-500 bg-slate-50/50 hover:bg-slate-100/50 dark:bg-slate-900/10 dark:hover:bg-slate-900/20";
			headerColorClass = "bg-slate-500";
			break;
		case "RUNNING":
			// Menggunakan warna Accent (biasanya Primary/Brand)
			cardStyles =
				"border-l-4 border-l-primary bg-accent/20 hover:bg-accent/30 dark:bg-accent/10 dark:hover:bg-accent/20";
			headerColorClass = "bg-primary";
			break;
	}

	return (
		<HoverCard openDelay={200}>
			<HoverCardTrigger asChild>
				<div
					className={cn(
						"group/card relative flex h-full w-full cursor-pointer flex-col justify-between rounded-r-md border border-l-0 p-2.5 text-xs shadow-sm transition-all hover:shadow-md",
						cardStyles,
					)}
				>
					{/* Header Card: Kode Kelas */}
					<div className="flex items-start justify-between gap-2">
						<span
							className="text-foreground/90 line-clamp-2 text-base leading-tight font-bold"
							title={data.kodeKelas}
						>
							{data.kodeKelas}
						</span>
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
								key="tipe-kelas"
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
								key="jumlah-murid"
								variant="outline"
								className="text-muted-foreground h-5 px-1.5 text-[10px] font-normal"
							>
								{data.jumlahMurid} Siswa Terdaftar
							</Badge>
							<Badge
								key="status-kelas"
								className={cn(
									"h-5 px-1.5 text-[10px] font-normal",
									headerColorClass,
								)}
							>
								{data.statusKelas}
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
				</div>
			</HoverCardContent>
		</HoverCard>
	);
}
