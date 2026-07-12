"use client";

import type { StatusOrderBuku } from "@prisma/client";
import {
	Album,
	ArrowRight,
	BookOpenCheck,
	BookX,
	CalendarClock,
	CalendarDays,
	Clock,
	Edit2,
	EllipsisVertical,
	GraduationCap,
	Trash,
	TrendingUp,
	User,
	Wallet,
} from "lucide-react";
import Link from "next/link";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { TypeKelasWithSesiPertemuanCount } from "@/types/kelas.type";
import { formatToWITA } from "@/utils/dateUtils";
import {
	formatStatus,
	statusOrderBukuColorMap,
	statusPendaftaranColorMap,
} from "@/utils/statusUtils";
import { toRupiah } from "@/utils/toRupiah";

// ── Props ─────────────────────────────────────────────────────────────────────
interface KelasListViewProps {
	data?: TypeKelasWithSesiPertemuanCount[];
	isLoading: boolean;
	onEditKelas: (item: TypeKelasWithSesiPertemuanCount) => void;
	onEditGuruKelas: (item: TypeKelasWithSesiPertemuanCount) => void;
	onUpLevel: (item: TypeKelasWithSesiPertemuanCount) => void;
	onDelete: (item: TypeKelasWithSesiPertemuanCount) => void;
	emptyMessage?: string;
}

// ── Helpers: jadwal string ────────────────────────────────────────────────────
type JadwalEntry = {
	hari: string;
	jamSlotTetap: { jamMulai: string; jamSelesai: string } | null;
	jamSlotCustom: { jamMulai: string; jamSelesai: string } | null;
	ruang: { namaRuang: string } | null;
};

const HARI_ORDER: Record<string, number> = {
	SENIN: 1,
	SELASA: 2,
	RABU: 3,
	KAMIS: 4,
	JUMAT: 5,
	SABTU: 6,
	MINGGU: 7,
};

function formatJadwal(jadwalKelas: JadwalEntry[]): string {
	if (jadwalKelas.length === 0) return "Jadwal belum diatur";
	return jadwalKelas
		.slice()
		.sort((a, b) => (HARI_ORDER[a.hari] ?? 99) - (HARI_ORDER[b.hari] ?? 99))
		.map((j) => {
			const slot = j.jamSlotTetap ?? j.jamSlotCustom;
			const timeRange = slot ? `(${slot.jamMulai} - ${slot.jamSelesai})` : "";
			const ruang = j.ruang ? ` - ${j.ruang.namaRuang}` : "";
			return `${j.hari} ${timeRange}${ruang}`;
		})
		.join(" | ");
}

// ── KelasCard (single card render) ───────────────────────────────────────────
function KelasCard({
	kelas,
	onEditKelas,
	onEditGuruKelas,
	onUpLevel,
	onDelete,
}: {
	kelas: TypeKelasWithSesiPertemuanCount;
	onEditKelas: (item: TypeKelasWithSesiPertemuanCount) => void;
	onEditGuruKelas: (item: TypeKelasWithSesiPertemuanCount) => void;
	onUpLevel: (item: TypeKelasWithSesiPertemuanCount) => void;
	onDelete: (item: TypeKelasWithSesiPertemuanCount) => void;
}) {
	const guruAktif =
		kelas.historyGuruKelases.length > 0
			? kelas.historyGuruKelases
					.map((h: { guru: { name: string | null } }) => h.guru.name ?? "")
					.join(" & ")
			: "Belum ada guru";

	const lastSession = kelas.sesiPertemuanKelases[0]?.tanggalWaktu;
	const jadwalHari = formatJadwal(kelas.jadwalKelas as JadwalEntry[]);
	const statusOrderBuku = (kelas as { statusOrderBuku?: StatusOrderBuku })
		.statusOrderBuku;

	const bookIconMap: Record<StatusOrderBuku, React.ReactNode> = {
		SUDAH_DIPESAN: <BookOpenCheck className="h-4 w-4" />,
		MENUNGGU_PERSETUJUAN: <Clock className="h-4 w-4" />,
		DIBATALKAN: <BookX className="h-4 w-4" />,
		BELUM_DIPROSES: <BookX className="h-4 w-4" />,
	};

	return (
		<Card className="py-0">
			<CardContent className="p-0">
				<AccordionItem value={kelas.id} className="border-none">
					<AccordionTrigger className="hover:bg-muted/30 items-center px-6 py-5 transition-colors hover:no-underline">
						<div className="flex w-full flex-col gap-4">
							{/* Header: Kode & Badges */}
							<div className="flex w-full flex-col justify-between gap-2 sm:flex-row sm:items-center">
								<span className="text-foreground text-lg font-bold tracking-tight">
									{kelas.kodeKelas}
								</span>
								<div className="flex flex-wrap items-center justify-end gap-2">
									<Badge
										variant="secondary"
										className="flex gap-1.5 px-2.5 py-1"
									>
										<GraduationCap className="h-3.5 w-3.5" />
										<span>{kelas._count.pendaftaranKelases}</span>
									</Badge>
									<Badge
										variant="outline"
										className="border-primary/30 text-primary flex gap-1.5 px-2.5 py-1"
									>
										<CalendarClock className="h-3.5 w-3.5" />
										<span>{kelas._count.sesiPertemuanKelases}</span>
									</Badge>
									{statusOrderBuku && (
										<Badge
											variant="outline"
											className={cn(
												"flex items-center justify-center gap-0 border-none p-1.5",
												statusOrderBukuColorMap[statusOrderBuku],
											)}
											title={formatStatus(statusOrderBuku)}
										>
											{bookIconMap[statusOrderBuku]}
										</Badge>
									)}
								</div>
							</div>

							{/* Metadata */}
							<div className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-2 text-xs">
								<div className="flex items-center gap-1.5">
									<User className="text-primary h-3.5 w-3.5" />
									<span className="font-medium">{guruAktif}</span>
								</div>
								<div className="flex items-center gap-1.5">
									<CalendarDays className="text-primary h-3.5 w-3.5" />
									<span>{jadwalHari}</span>
								</div>
								{kelas.deskripsi && (
									<div className="flex items-center gap-1.5">
										<Album className="text-primary h-3.5 w-3.5" />
										<span className="line-clamp-1 max-w-[200px]">
											{kelas.deskripsi}
										</span>
									</div>
								)}
							</div>
						</div>
					</AccordionTrigger>

					<AccordionContent className="bg-muted/5 border-t px-6 py-5 data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
						<div className="flex flex-col gap-6">
							{/* Info Grid */}
							<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
								<div className="flex flex-col gap-1 rounded-lg border p-3">
									<span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
										Harga Kelas
									</span>
									<div className="flex items-baseline gap-1">
										<span className="text-lg font-semibold">
											{toRupiah(kelas.hargaKelas)}
										</span>
										<span className="text-muted-foreground text-xs">
											/ sesi
										</span>
									</div>
								</div>
								<div className="flex flex-col gap-1 rounded-lg border p-3">
									<span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
										Sesi Terakhir
									</span>
									<div className="font-medium">
										{lastSession ? (
											formatToWITA(lastSession)
										) : (
											<span className="text-muted-foreground italic">
												Belum ada sesi
											</span>
										)}
									</div>
								</div>
							</div>

							{/* Daftar Murid */}
							<div>
								<p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
									Murid Aktif ({kelas._count.pendaftaranKelases})
								</p>
								{kelas.pendaftaranKelases.length > 0 ? (
									<div className="flex flex-col">
										{kelas.pendaftaranKelases.map((p, index: number) => (
											<div key={p.id} className="flex flex-col">
												<div className="flex items-center justify-between py-2">
													<div className="flex items-center">
														<span className="text-muted-foreground min-w-[24px] text-sm">
															{index + 1}.
														</span>
														<span className="text-sm">
															{p.murid?.namaLengkap ?? "Unknown"} |{" "}
															{p.murid?.umur} | {p.murid?.kelasSekolah}
														</span>
													</div>
													<Badge
														variant="outline"
														className={cn(
															"border-none",
															statusPendaftaranColorMap[p.status],
														)}
													>
														{formatStatus(p.status)}
													</Badge>
												</div>
												{index < kelas.pendaftaranKelases.length - 1 && (
													<Separator />
												)}
											</div>
										))}
									</div>
								) : (
									<p className="text-sm text-muted-foreground italic">
										Belum ada murid aktif.
									</p>
								)}
							</div>

							{/* Actions */}
							<div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
								<Button
									asChild
									size="sm"
									variant="ghost"
									className="w-full justify-start sm:w-auto"
								>
									<Link href={`/admin/kelas/sesi/${kelas.id}`}>
										<CalendarClock className="mr-2 h-4 w-4" />
										Riwayat Absensi
									</Link>
								</Button>
								<div className="flex items-center gap-2">
									<Button asChild size="sm" className="w-full sm:w-auto">
										<Link href={`/admin/kelas/detail/${kelas.id}`}>
											Detail Kelas
											<ArrowRight className="ml-2 h-4 w-4" />
										</Link>
									</Button>
									<Button
										asChild
										size="sm"
										variant="secondary"
										className="w-full sm:w-auto"
									>
										<Link href={`/admin/pembayaran?kelasId=${kelas.id}`}>
											<Wallet className="mr-2 h-4 w-4" />
											Pembayaran Kelas
										</Link>
									</Button>
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<Button
												variant="outline"
												size="icon"
												className="h-9 w-9 shrink-0"
											>
												<EllipsisVertical className="h-4 w-4" />
												<span className="sr-only">Menu</span>
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent align="end" className="w-48">
											<DropdownMenuItem onClick={() => onEditKelas(kelas)}>
												<Edit2 className="mr-2 h-4 w-4" />
												Edit Data Kelas
											</DropdownMenuItem>
											<DropdownMenuItem onClick={() => onEditGuruKelas(kelas)}>
												<User className="mr-2 h-4 w-4" />
												Ganti Pengajar
											</DropdownMenuItem>
											<DropdownMenuSeparator />
											<DropdownMenuItem onClick={() => onUpLevel(kelas)}>
												<TrendingUp className="mr-2 h-4 w-4" />
												Naik Level (Up Level)
											</DropdownMenuItem>
											<DropdownMenuSeparator />
											<DropdownMenuItem
												variant="destructive"
												onClick={() => onDelete(kelas)}
											>
												<Trash className="mr-2 h-4 w-4" />
												Hapus Kelas
											</DropdownMenuItem>
										</DropdownMenuContent>
									</DropdownMenu>
								</div>
							</div>
						</div>
					</AccordionContent>
				</AccordionItem>
			</CardContent>
		</Card>
	);
}

// ── Sub-group label (Reguler / Private) ───────────────────────────────────────
function SubGroupLabel({ label, count }: { label: string; count: number }) {
	const isPrivate = label.toLowerCase() === "private";
	return (
		<div className="mb-2 flex items-center gap-2">
			<span
				className={cn(
					"rounded-md px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-widest text-white",
					isPrivate ? "bg-purple-500" : "bg-blue-500",
				)}
			>
				{label}
			</span>
			<span className="text-muted-foreground/60 text-[11px]">({count})</span>
		</div>
	);
}

// ── Main export ───────────────────────────────────────────────────────────────
export function KelasListView({
	data,
	isLoading,
	onEditKelas,
	onEditGuruKelas,
	onUpLevel,
	onDelete,
	emptyMessage = "Belum ada kelas.",
}: KelasListViewProps) {
	if (isLoading) {
		return (
			<div className="space-y-4 pt-4">
				{Array.from({ length: 3 }, (_, i) => i).map((id) => (
					<Skeleton key={id} className="h-24 w-full rounded-lg" />
				))}
			</div>
		);
	}

	if (!data || data.length === 0) {
		return (
			<p className="text-muted-foreground py-8 text-center">{emptyMessage}</p>
		);
	}

	// 1. Sort prioritas huruf dulu (A sebelum B), baru level (1A sebelum 2A)
	const sorted = [...data].sort((a, b) => {
		const letterA = a.kodeKelas.replace(/[^a-zA-Z]/g, "").toUpperCase();
		const letterB = b.kodeKelas.replace(/[^a-zA-Z]/g, "").toUpperCase();
		if (letterA !== letterB) return letterA.localeCompare(letterB);
		return a.kodeKelas.localeCompare(b.kodeKelas, undefined, {
			numeric: true,
			sensitivity: "base",
		});
	});

	// 2. Group by jenisKelas → sub by tipe
	type KelasItem = (typeof sorted)[number];
	const groupMap = new Map<
		string,
		{ REGULAR: KelasItem[]; PRIVATE: KelasItem[] }
	>();
	for (const kelas of sorted) {
		const jenisNama = kelas.jenisKelasRel?.nama ?? "Lainnya";
		if (!groupMap.has(jenisNama))
			groupMap.set(jenisNama, { REGULAR: [], PRIVATE: [] });
		const group = groupMap.get(jenisNama);
		if (group) {
			if (kelas.jenisKelasRel?.tipe === "PRIVATE") {
				group.PRIVATE.push(kelas);
			} else {
				group.REGULAR.push(kelas);
			}
		}
	}

	// 3. Sort groups A→Z by jenis nama (abjad murni, tidak berdasarkan level)
	const groups = [...groupMap.entries()].sort(([a], [b]) => a.localeCompare(b));

	const cardProps = { onEditKelas, onEditGuruKelas, onUpLevel, onDelete };

	return (
		<div className="space-y-8 pt-2">
			{groups.map(([jenisNama, { REGULAR, PRIVATE }]) => (
				<div key={jenisNama}>
					{/* Jenis header */}
					<div className="mb-4 flex items-center gap-3">
						<span className="bg-primary/10 text-primary rounded-md px-3 py-1 text-sm font-bold uppercase tracking-wider">
							{jenisNama}
						</span>
						<span className="text-muted-foreground text-xs">
							{REGULAR.length + PRIVATE.length} kelas
						</span>
						<div className="bg-border h-px flex-1" />
					</div>

					<div className="space-y-4 pl-1">
						{/* Reguler */}
						{REGULAR.length > 0 && (
							<div className="rounded-xl bg-blue-50/60 p-4 dark:bg-blue-950/20">
								<SubGroupLabel label="Reguler" count={REGULAR.length} />
								<Accordion
									type="multiple"
									className="flex w-full flex-col gap-3"
								>
									{REGULAR.map((kelas) => (
										<KelasCard key={kelas.id} kelas={kelas} {...cardProps} />
									))}
								</Accordion>
							</div>
						)}

						{/* Private */}
						{PRIVATE.length > 0 && (
							<div className="rounded-xl bg-purple-50/60 p-4 dark:bg-purple-950/20">
								<SubGroupLabel label="Private" count={PRIVATE.length} />
								<Accordion
									type="multiple"
									className="flex w-full flex-col gap-3"
								>
									{PRIVATE.map((kelas) => (
										<KelasCard key={kelas.id} kelas={kelas} {...cardProps} />
									))}
								</Accordion>
							</div>
						)}
					</div>
				</div>
			))}
		</div>
	);
}
