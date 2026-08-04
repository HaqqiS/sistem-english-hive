"use client";

import { Hari } from "@prisma/client";
import { Clock, EllipsisVertical, MapPin, User } from "lucide-react";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import type { TypeJadwalKelas } from "@/types/jadwalKelas.type";

interface ScheduleListViewProps {
	data?: TypeJadwalKelas[];
	isLoading: boolean;
	onEdit: (item: TypeJadwalKelas) => void;
	onDelete: (id: string, deskripsi: string) => void;
}

// Urutan hari Senin -> Minggu (harus sinkron dengan enum Hari di Prisma)
const HARI_ORDER: Hari[] = [
	Hari.SENIN,
	Hari.SELASA,
	Hari.RABU,
	Hari.KAMIS,
	Hari.JUMAT,
	Hari.SABTU,
	Hari.MINGGU,
];

const HARI_LABEL: Record<Hari, string> = {
	[Hari.SENIN]: "Senin",
	[Hari.SELASA]: "Selasa",
	[Hari.RABU]: "Rabu",
	[Hari.KAMIS]: "Kamis",
	[Hari.JUMAT]: "Jumat",
	[Hari.SABTU]: "Sabtu",
	[Hari.MINGGU]: "Minggu",
};

// ---------------------------------------------------------------------------
// Warna: tiap NILAI (nama guru, nama ruang, rentang jam) selalu dapat warna
// yang SAMA setiap muncul, dengan cara hash string -> index palet warna.
// ---------------------------------------------------------------------------
const COLOR_PALETTE = [
	{
		bg: "bg-rose-100 dark:bg-rose-950/40",
		text: "text-rose-700 dark:text-rose-300",
	},
	{
		bg: "bg-amber-100 dark:bg-amber-950/40",
		text: "text-amber-700 dark:text-amber-300",
	},
	{
		bg: "bg-emerald-100 dark:bg-emerald-950/40",
		text: "text-emerald-700 dark:text-emerald-300",
	},
	{
		bg: "bg-cyan-100 dark:bg-cyan-950/40",
		text: "text-cyan-700 dark:text-cyan-300",
	},
	{
		bg: "bg-fuchsia-100 dark:bg-fuchsia-950/40",
		text: "text-fuchsia-700 dark:text-fuchsia-300",
	},
	{
		bg: "bg-orange-100 dark:bg-orange-950/40",
		text: "text-orange-700 dark:text-orange-300",
	},
	{
		bg: "bg-teal-100 dark:bg-teal-950/40",
		text: "text-teal-700 dark:text-teal-300",
	},
	{
		bg: "bg-pink-100 dark:bg-pink-950/40",
		text: "text-pink-700 dark:text-pink-300",
	},
	{
		bg: "bg-lime-100 dark:bg-lime-950/40",
		text: "text-lime-700 dark:text-lime-300",
	},
	{
		bg: "bg-sky-100 dark:bg-sky-950/40",
		text: "text-sky-700 dark:text-sky-300",
	},
	{
		bg: "bg-violet-100 dark:bg-violet-950/40",
		text: "text-violet-700 dark:text-violet-300",
	},
	{
		bg: "bg-yellow-100 dark:bg-yellow-950/40",
		text: "text-yellow-700 dark:text-yellow-300",
	},
];

function hashString(str: string): number {
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		hash = (hash << 5) - hash + str.charCodeAt(i);
		hash |= 0; // convert to 32-bit int
	}
	return Math.abs(hash);
}

function getColorFor(key: string) {
	const palette =
		COLOR_PALETTE[hashString(key.toLowerCase().trim()) % COLOR_PALETTE.length];
	return palette ?? COLOR_PALETTE[0]!;
}

function getJenisKelasLabel(kodeKelas: string) {
	const upper = kodeKelas.toUpperCase();
	if (upper.includes("PRIVATE") || upper.includes("PRIVAT")) return "PRIVATE";
	if (upper.includes("REGULAR") || upper.includes("REGULER")) return "REGULAR";
	return "LAINNYA";
}

function getJumlahPertemuan(item: TypeJadwalKelas) {
	return (
		(item.kelas as unknown as { _count?: { sesiPertemuanKelases: number } })
			._count?.sesiPertemuanKelases ?? 0
	);
}

function ColorPill({
	label,
	colorClass,
}: {
	label: string;
	colorClass: { bg: string; text: string };
}) {
	return (
		<span
			className={`inline-block rounded px-1.5 py-0.5 text-[10px] leading-none font-medium whitespace-nowrap ${colorClass.bg} ${colorClass.text}`}
		>
			{label}
		</span>
	);
}

function getNamaPengajar(item: TypeJadwalKelas) {
	const historyGuru = (
		item.kelas as unknown as {
			historyGuruKelases?: { guru: { name: string | null } }[];
		}
	).historyGuruKelases;

	if (!historyGuru || historyGuru.length === 0) return "Belum ada guru";

	return historyGuru.map((h) => h.guru.name ?? "-").join(" & ");
}

// Urutan kolom: Jam | Ruang | Kelas | Sesi | Pengajar | Aksi
const TH_CLASS =
	"text-muted-foreground whitespace-nowrap px-3 py-1.5 text-left text-[10px] font-semibold tracking-wide uppercase";
const TD_CLASS = "whitespace-nowrap px-3 py-1.5 align-middle text-[11px]";

function ScheduleRow({
	item,
	onEdit,
	onDelete,
}: {
	item: TypeJadwalKelas;
	onEdit: (item: TypeJadwalKelas) => void;
	onDelete: (id: string, deskripsi: string) => void;
}) {
	const tetap = item.jamSlotTetap;
	const custom = item.jamSlotCustom;
	const jamMulai = tetap?.jamMulai ?? custom?.jamMulai ?? "-";
	const jamSelesai = tetap?.jamSelesai ?? custom?.jamSelesai ?? "-";
	const namaPengajar = getNamaPengajar(item);
	const deskripsiHapus = `${item.kelas.kodeKelas} (${HARI_LABEL[item.hari]})`;

	const jamLabel = `${jamMulai}-${jamSelesai}`;
	const kelasColor = getColorFor(getJenisKelasLabel(item.kelas.kodeKelas));
	const ruangColor = getColorFor(item.ruang.namaRuang);
	const jamColor = getColorFor(jamLabel);
	const guruColor = getColorFor(namaPengajar);
	const jumlahPertemuan = getJumlahPertemuan(item);

	return (
		<tr className="border-border/60 hover:bg-muted/30 border-b transition-colors last:border-b-0">
			<td className={TD_CLASS}>
				<span className="inline-flex items-center gap-1">
					<Clock className="text-muted-foreground h-3 w-3 shrink-0" />
					<ColorPill label={jamLabel} colorClass={jamColor} />
				</span>
			</td>
			<td className={TD_CLASS}>
				<span className="inline-flex items-center gap-1">
					<MapPin className="text-muted-foreground h-3 w-3 shrink-0" />
					<ColorPill label={item.ruang.namaRuang} colorClass={ruangColor} />
				</span>
			</td>
			<td className={TD_CLASS}>
				<ColorPill label={item.kelas.kodeKelas} colorClass={kelasColor} />
			</td>
			<td className={`${TD_CLASS} text-muted-foreground`}>
				{jumlahPertemuan}x
			</td>
			<td className={TD_CLASS}>
				<span className="inline-flex items-center gap-1">
					<User className="text-muted-foreground h-3 w-3 shrink-0" />
					<ColorPill label={namaPengajar} colorClass={guruColor} />
				</span>
			</td>
			<td className={`${TD_CLASS} text-right`}>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							variant="ghost"
							size="icon"
							className="data-[state=open]:bg-muted h-6 w-6"
						>
							<EllipsisVertical className="h-3.5 w-3.5" />
							<span className="sr-only">Buka menu</span>
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end" className="w-40">
						<DropdownMenuItem onClick={() => onEdit(item)}>
							Edit Jadwal
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem
							className="text-destructive focus:text-destructive"
							onClick={() => onDelete(item.id, deskripsiHapus)}
						>
							Delete
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</td>
		</tr>
	);
}

function ScheduleRowSkeleton() {
	return (
		<tr className="border-border/60 border-b last:border-b-0">
			<td className={TD_CLASS}>
				<Skeleton className="h-4 w-16" />
			</td>
			<td className={TD_CLASS}>
				<Skeleton className="h-4 w-14" />
			</td>
			<td className={TD_CLASS}>
				<Skeleton className="h-4 w-16" />
			</td>
			<td className={TD_CLASS}>
				<Skeleton className="h-4 w-8" />
			</td>
			<td className={TD_CLASS}>
				<Skeleton className="h-4 w-20" />
			</td>
			<td className={`${TD_CLASS} text-right`}>
				<Skeleton className="ml-auto h-6 w-6 rounded-md" />
			</td>
		</tr>
	);
}

export function ScheduleListView({
	data,
	isLoading,
	onEdit,
	onDelete,
}: ScheduleListViewProps) {
	// Kelompokkan jadwal per hari, Senin -> Minggu
	const groupedByHari = useMemo(() => {
		const groups = new Map<Hari, TypeJadwalKelas[]>();
		for (const hari of HARI_ORDER) {
			groups.set(hari, []);
		}

		for (const item of data ?? []) {
			const list = groups.get(item.hari);
			if (list) {
				list.push(item);
			}
		}

		// Urutkan tiap grup berdasarkan jam mulai
		for (const [, list] of groups) {
			list.sort((a, b) => {
				const jamA =
					a.jamSlotTetap?.jamMulai ?? a.jamSlotCustom?.jamMulai ?? "";
				const jamB =
					b.jamSlotTetap?.jamMulai ?? b.jamSlotCustom?.jamMulai ?? "";
				return jamA.localeCompare(jamB);
			});
		}

		return groups;
	}, [data]);

	if (isLoading) {
		return (
			<div className="flex flex-col gap-3">
				{HARI_ORDER.slice(0, 3).map((hari) => (
					<div
						key={hari}
						className="border-border/60 overflow-x-auto rounded-lg border"
					>
						<div className="bg-muted/40 px-3 py-1.5">
							<Skeleton className="h-3.5 w-16" />
						</div>
						<table className="w-full border-collapse">
							<tbody>
								<ScheduleRowSkeleton />
								<ScheduleRowSkeleton />
							</tbody>
						</table>
					</div>
				))}
			</div>
		);
	}

	const isEmpty = (data?.length ?? 0) === 0;

	if (isEmpty) {
		return (
			<div className="text-muted-foreground flex h-32 items-center justify-center rounded-xl border border-dashed text-xs">
				Belum ada jadwal.
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-3">
			{HARI_ORDER.map((hari) => {
				const items = groupedByHari.get(hari) ?? [];
				if (items.length === 0) return null;

				return (
					<div
						key={hari}
						className="border-border/60 overflow-x-auto rounded-lg border"
					>
						<div className="bg-muted/40 flex items-center gap-1.5 px-3 py-1.5">
							<h3 className="text-[11px] font-bold tracking-wide uppercase sm:text-xs">
								{HARI_LABEL[hari]}
							</h3>
							<span className="text-muted-foreground text-[10px]">
								({items.length})
							</span>
						</div>
						<table className="w-full border-collapse">
							<thead>
								<tr className="border-border/60 border-b">
									<th className={TH_CLASS}>Jam</th>
									<th className={TH_CLASS}>Ruang</th>
									<th className={TH_CLASS}>Kelas</th>
									<th className={TH_CLASS}>Sesi</th>
									<th className={TH_CLASS}>Pengajar</th>
									<th className={TH_CLASS} />
								</tr>
							</thead>
							<tbody>
								{items.map((item) => (
									<ScheduleRow
										key={item.id}
										item={item}
										onEdit={onEdit}
										onDelete={onDelete}
									/>
								))}
							</tbody>
						</table>
					</div>
				);
			})}
		</div>
	);
}
