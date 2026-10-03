"use client";

import { StatusAbsenMurid, StatusPendaftaran } from "@prisma/client";
import type { RowInput } from "jspdf-autotable";
import {
	AlertCircle,
	ArrowLeft,
	CalendarDays,
	ChevronDown,
	FileText,
	GraduationCap,
	Users,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { HeaderActionPortal } from "@/app/_components/shared/header-action-portal";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import {
	PERTEMUAN_FINAL_TEST,
	PERTEMUAN_MIDDLE_TEST,
} from "@/constants/sesi-event";
import { useSesiPertemuan } from "@/hooks/useSesiPertemuan";
import { cn } from "@/lib/utils";
import { formatToWITA } from "@/utils/dateUtils";
import { formatStatus, statusPendaftaranColorMap } from "@/utils/statusUtils";

/**
 * Helper untuk mendapatkan teks dan varian badge berdasarkan status absensi
 */
function getBadgeContent(status: StatusAbsenMurid | null): {
	text: string;
	variant: "default" | "destructive" | "secondary" | "outline";
} {
	switch (status) {
		case StatusAbsenMurid.HADIR:
			return { text: "H", variant: "default" }; // Hijau
		case StatusAbsenMurid.ALPA:
			return { text: "A", variant: "destructive" }; // Merah
		case StatusAbsenMurid.OFF_SEMENTARA:
			return { text: "Off", variant: "secondary" }; // Abu-abu
		default:
			return { text: "-", variant: "outline" }; // Kosong
	}
}

/** Warna kotak kehadiran (dipakai di legenda, kartu HP, dan tabel PC) */
const KOTAK_STATUS = {
	HADIR: "bg-green-600 text-white",
	ALPA: "bg-red-600 text-white",
	OFF: "bg-muted text-foreground border",
	NONE: "border border-dashed text-muted-foreground",
};

function kotakStatus(status: StatusAbsenMurid | null): string {
	if (status === StatusAbsenMurid.HADIR) return KOTAK_STATUS.HADIR;
	if (status === StatusAbsenMurid.ALPA) return KOTAK_STATUS.ALPA;
	if (status === StatusAbsenMurid.OFF_SEMENTARA) return KOTAK_STATUS.OFF;
	return KOTAK_STATUS.NONE;
}

/** "Pertemuan 12" -> 12 */
function nomorPertemuan(label: string): number {
	return Number(label.replace(/\D/g, "")) || 0;
}

function eventUjian(no: number) {
	if (no === PERTEMUAN_MIDDLE_TEST) {
		return {
			label: "Middle Test",
			cls: "bg-violet-600 text-white",
			ring: "ring-violet-500",
		};
	}
	if (no === PERTEMUAN_FINAL_TEST) {
		return {
			label: "Final Test",
			cls: "bg-red-600 text-white",
			ring: "ring-red-500",
		};
	}
	return null;
}

function ringkasKehadiran(
	attendance: Record<string, StatusAbsenMurid | null | undefined>,
	columns: { sesiId: string }[],
) {
	let hadir = 0;
	let alpa = 0;
	let off = 0;
	for (const col of columns) {
		const st = attendance[col.sesiId];
		if (st === StatusAbsenMurid.HADIR) hadir++;
		else if (st === StatusAbsenMurid.ALPA) alpa++;
		else if (st === StatusAbsenMurid.OFF_SEMENTARA) off++;
	}
	return { hadir, alpa, off };
}

export default function RekapSesiGuruClient() {
	const { kelasId } = useParams<{ kelasId: string }>();

	// 1. Ambil data rekap menggunakan hook
	const {
		dataSummary: dataRekap,
		isLoadingSummary,
		isErrorSummary,
		errorSummary,
	} = useSesiPertemuan({
		kelasId: kelasId,
	});

	const handleExportAbsensi = async () => {
		if (!dataRekap) return;

		try {
			const { default: jsPDF } = await import("jspdf");
			const { default: autoTable } = await import("jspdf-autotable");

			const { kelasInfo, columnData, rowData } = dataRekap;

			const doc = new jsPDF({
				orientation: "landscape",
			});

			doc.setFontSize(16);
			doc.text(`Presensi Kelas: ${kelasInfo.kodeKelas}`, 14, 15);
			doc.setFontSize(11);
			doc.text(`Guru Aktif: ${kelasInfo.guruAktif}`, 14, 22);

			// Row 1: Hari & Tanggal (RABU 04/02)
			const headerRow1 = [
				{
					content: "Nama Siswa",
					rowSpan: 3,
					styles: { halign: "left" as const, valign: "middle" as const },
				},
				...columnData.map((col) => {
					const hari = formatToWITA(col.tanggal, "dddd").toUpperCase();
					const tgl = formatToWITA(col.tanggal, "DD/MM");
					return `${hari}\n${tgl}`;
				}),
			];

			// Row 2: Pertemuan Ke (Pertemuan 1)
			const headerRow2 = columnData.map((col) => `${col.pertemuanKe}`);

			// Row 3: Pengajar (Galih)
			const headerRow3 = columnData.map(
				(col) => col.pengajar.split(" ")[0] || "",
			);

			const head: RowInput[] = [headerRow1, headerRow2, headerRow3];

			const body = rowData.map((row) => {
				const cellData = [row.namaSiswa];
				columnData.forEach((col) => {
					const status = row.attendance[col.sesiId];
					const { text } = getBadgeContent(status ?? null);
					cellData.push(text);
				});
				return cellData;
			});

			const totalSessions = columnData.length;
			const dynamicFontSize =
				totalSessions > 20 ? 6 : totalSessions > 12 ? 7 : 8;
			const dynamicPadding = totalSessions > 15 ? 1 : 1.5;

			autoTable(doc, {
				head: head,
				body: body,
				startY: 28,
				theme: "grid",
				styles: {
					fontSize: dynamicFontSize,
					cellPadding: dynamicPadding,
					overflow: "linebreak",
					halign: "center",
					valign: "middle",
				},
				headStyles: {
					fillColor: [15, 23, 42],
					textColor: 255,
					halign: "center",
					valign: "middle",
					fontSize: dynamicFontSize,
					cellPadding: dynamicPadding,
				},
				columnStyles: {
					0: {
						halign: "left",
						cellWidth: 40,
						fontStyle: "bold",
						fontSize: dynamicFontSize + 0.5,
					},
				},
				didParseCell: (data) => {
					if (data.section === "body" && data.column.index > 0) {
						const text = data.cell.raw as string;
						if (text === "H") {
							data.cell.styles.textColor = [22, 163, 74];
							data.cell.styles.fontStyle = "bold";
						} else if (text === "A") {
							data.cell.styles.textColor = [220, 38, 38];
							data.cell.styles.fontStyle = "bold";
						} else if (text === "Off") {
							data.cell.styles.textColor = [107, 114, 128];
						}
					}
				},
			});

			doc.save(`Presensi_${kelasInfo.kodeKelas}.pdf`);
		} catch (error) {
			toast.error("Gagal mengekspor PDF");
			console.error("PDF Export Error:", error);
		}
	};

	// 2. Loading State
	if (isLoadingSummary) {
		return (
			<Card>
				<CardHeader>
					<Skeleton className="h-8 w-1/2" />
					<Skeleton className="h-4 w-1/4" />
				</CardHeader>
				<CardContent>
					<Skeleton className="h-64 w-full" />
				</CardContent>
			</Card>
		);
	}

	// 3. Error State
	if (isErrorSummary) {
		return (
			<Alert variant="destructive">
				<AlertCircle className="h-4 w-4" />
				<AlertTitle>Gagal Memuat Data</AlertTitle>
				<AlertDescription>{errorSummary?.message}</AlertDescription>
			</Alert>
		);
	}

	// 4. Empty State
	if (!dataRekap || dataRekap.columnData.length === 0) {
		return (
			<>
				<HeaderActionPortal>
					<div className="flex items-center gap-2">
						<Button variant="outline" size="sm" asChild>
							<Link href={"/guru/absen"}>
								<ArrowLeft className="mr-2 h-4 w-4" />
								<span>Kembali</span>
							</Link>
						</Button>
					</div>
				</HeaderActionPortal>
				<Card className="flex flex-col items-center justify-center p-10 gap-6">
					<div className="flex flex-col items-center text-center">
						<FileText className="text-muted-foreground h-16 w-16" />
						<CardTitle className="mt-4">Belum Ada Sesi</CardTitle>
						<CardDescription className="mt-2 text-center">
							Belum ada sesi pertemuan yang tercatat untuk kelas ini.
						</CardDescription>
					</div>
				</Card>
			</>
		);
	}

	const { kelasInfo, columnData, rowData } = dataRekap;

	// 5. Success State
	const totalPertemuan = columnData.length;

	return (
		<TooltipProvider delayDuration={150}>
			<HeaderActionPortal>
				<div className="flex items-center gap-2">
					<Button variant="outline" size="sm" asChild>
						<Link href={"/guru/absen"}>
							<ArrowLeft className="mr-2 h-4 w-4" />
							<span>Kembali</span>
						</Link>
					</Button>
					<Button variant="outline" size="sm" onClick={handleExportAbsensi}>
						<FileText className="mr-2 h-4 w-4" />
						<span className="hidden sm:inline">Export PDF Presensi</span>
						<span className="sm:hidden">Export</span>
					</Button>
				</div>
			</HeaderActionPortal>

			<div className="space-y-3">
				{/* --- Info kelas + legenda --- */}
				<div className="bg-card space-y-3 rounded-2xl border p-4 shadow-sm">
					<div className="space-y-1">
						<p className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">
							Rekap Presensi
						</p>
						<h2 className="text-base leading-snug font-bold break-words">
							{kelasInfo.kodeKelas}
						</h2>
						<p className="text-muted-foreground flex items-start gap-1.5 text-sm">
							<GraduationCap className="mt-0.5 h-4 w-4 shrink-0" />
							<span className="text-foreground font-medium break-words">
								{kelasInfo.guruAktif}
							</span>
						</p>
					</div>

					<div className="flex flex-wrap gap-2">
						<Badge
							variant="secondary"
							className="h-7 gap-1.5 rounded-full px-3 text-xs"
						>
							<CalendarDays className="h-3.5 w-3.5" />
							{totalPertemuan} Pertemuan
						</Badge>
						<Badge
							variant="secondary"
							className="h-7 gap-1.5 rounded-full px-3 text-xs"
						>
							<Users className="h-3.5 w-3.5" />
							{rowData.length} Siswa
						</Badge>
					</div>

					<div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t pt-3 text-xs">
						{[
							{ label: "Hadir", cls: KOTAK_STATUS.HADIR },
							{ label: "Alpa", cls: KOTAK_STATUS.ALPA },
							{ label: "Off", cls: KOTAK_STATUS.OFF },
							{ label: "Belum ada", cls: KOTAK_STATUS.NONE },
						].map((l) => (
							<span key={l.label} className="flex items-center gap-1.5">
								<span className={cn("size-3.5 rounded", l.cls)} />
								{l.label}
							</span>
						))}
					</div>
				</div>

				{/* --- Daftar pertemuan (tanggal & pengajar) --- */}
				<details className="group bg-card overflow-hidden rounded-2xl border shadow-sm">
					<summary className="active:bg-muted/50 flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
						<span className="text-sm font-semibold">
							Daftar Pertemuan ({totalPertemuan})
						</span>
						<ChevronDown className="text-muted-foreground h-5 w-5 transition-transform group-open:rotate-180" />
					</summary>
					<ul className="divide-y border-t">
						{columnData.map((col) => {
							const no = nomorPertemuan(col.pertemuanKe);
							const ev = eventUjian(no);
							return (
								<li
									key={col.sesiId}
									className="flex items-center gap-3 px-4 py-2.5"
								>
									<span className="bg-muted flex size-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold">
										{no}
									</span>
									<div className="min-w-0 flex-1">
										<p className="flex flex-wrap items-center gap-1.5 text-sm font-medium">
											{formatToWITA(col.tanggal, "dddd, D MMM YYYY")}
											{ev && (
												<span
													className={cn(
														"rounded px-1.5 py-0.5 text-[10px] leading-none font-bold uppercase",
														ev.cls,
													)}
												>
													{ev.label}
												</span>
											)}
										</p>
										<p className="text-muted-foreground text-xs break-words">
											{formatToWITA(col.tanggal, "HH:mm")} WITA · {col.pengajar}
										</p>
									</div>
								</li>
							);
						})}
					</ul>
				</details>

				{/* --- HP: kartu per siswa dengan kotak kehadiran --- */}
				<div className="space-y-3 md:hidden">
					{rowData.map((row) => {
						const ringkas = ringkasKehadiran(row.attendance, columnData);
						return (
							<div
								key={row.studentId}
								className="bg-card space-y-3 rounded-2xl border p-4 shadow-sm"
							>
								<div className="flex items-start justify-between gap-2">
									<div className="min-w-0 space-y-1">
										<p className="text-sm leading-snug font-semibold break-words">
											{row.namaSiswa}
										</p>
										<div className="flex flex-wrap gap-1">
											{row.statusPendaftaran === StatusPendaftaran.TRIAL && (
												<Badge
													className={cn(
														"h-4 px-1.5 py-0 text-[10px]",
														statusPendaftaranColorMap[StatusPendaftaran.TRIAL],
													)}
												>
													{formatStatus(StatusPendaftaran.TRIAL)}
												</Badge>
											)}
											{row.statusPendaftaran ===
												StatusPendaftaran.OFF_SEMENTARA && (
												<Badge
													className={cn(
														"h-4 px-1.5 py-0 text-[10px]",
														statusPendaftaranColorMap[
															StatusPendaftaran.OFF_SEMENTARA
														],
													)}
												>
													{formatStatus(StatusPendaftaran.OFF_SEMENTARA)}
												</Badge>
											)}
										</div>
									</div>
									<div className="flex shrink-0 items-center gap-1.5 text-[11px] font-semibold">
										<span className="rounded-md bg-green-100 px-1.5 py-1 text-green-700 dark:bg-green-950/50 dark:text-green-300">
											H {ringkas.hadir}
										</span>
										<span className="rounded-md bg-red-100 px-1.5 py-1 text-red-700 dark:bg-red-950/50 dark:text-red-300">
											A {ringkas.alpa}
										</span>
										<span className="bg-muted text-muted-foreground rounded-md px-1.5 py-1">
											Off {ringkas.off}
										</span>
									</div>
								</div>

								<div className="flex flex-wrap gap-1.5">
									{columnData.map((col) => {
										const status = row.attendance[col.sesiId] ?? null;
										const no = nomorPertemuan(col.pertemuanKe);
										const ev = eventUjian(no);
										return (
											<span
												key={col.sesiId}
												title={`Pertemuan ${no} · ${formatToWITA(col.tanggal, "D MMM YYYY")}`}
												className={cn(
													"flex size-8 items-center justify-center rounded-lg text-xs font-semibold",
													kotakStatus(status),
													ev && `ring-2 ring-offset-1 ${ev.ring}`,
												)}
											>
												{no}
											</span>
										);
									})}
								</div>
							</div>
						);
					})}
				</div>

				{/* --- Tablet/PC: tabel rekap --- */}
				<div className="bg-card hidden overflow-hidden rounded-2xl border shadow-sm md:block">
					<div className="overflow-x-auto">
						<Table className="min-w-max">
							<TableHeader>
								<TableRow>
									<TableHead
										rowSpan={3}
										className="bg-muted sticky left-0 z-20 min-w-40 border-r align-middle"
									>
										Nama Siswa
									</TableHead>
									{columnData.map((col) => (
										<TableHead
											key={col.sesiId}
											className="relative p-0 text-center align-top"
										>
											<div className="flex flex-col items-center justify-center gap-1 border-b px-4 pt-2 pb-1">
												<Tooltip>
													<TooltipTrigger asChild>
														<div className="cursor-help text-xs font-semibold tracking-wider uppercase">
															{formatToWITA(col.tanggal, "dddd")} <br />
															{formatToWITA(col.tanggal, "DD/MM")}
														</div>
													</TooltipTrigger>
													<TooltipContent>
														{formatToWITA(
															col.tanggal,
															"dddd, D MMMM YYYY, HH:mm",
														)}
													</TooltipContent>
												</Tooltip>
											</div>
										</TableHead>
									))}
								</TableRow>

								<TableRow>
									{columnData.map((col) => {
										const ev = eventUjian(nomorPertemuan(col.pertemuanKe));
										return (
											<TableHead
												key={col.sesiId}
												className="text-muted-foreground text-center text-xs"
											>
												{col.pertemuanKe}
												{ev && (
													<span
														className={cn(
															"mt-1 block rounded px-1 py-0.5 text-[9px] leading-none font-bold uppercase",
															ev.cls,
														)}
													>
														{ev.label}
													</span>
												)}
											</TableHead>
										);
									})}
								</TableRow>

								<TableRow>
									{columnData.map((col) => (
										<TableHead
											key={col.sesiId}
											className="text-center text-xs font-medium"
										>
											{col.pengajar}
										</TableHead>
									))}
								</TableRow>
							</TableHeader>
							<TableBody>
								{rowData.map((row) => (
									<TableRow key={row.studentId}>
										<TableCell className="bg-background sticky left-0 z-20 border-r text-sm font-medium">
											<div className="flex items-center gap-2">
												<span>{row.namaSiswa}</span>
												{row.statusPendaftaran === StatusPendaftaran.TRIAL && (
													<Badge
														className={cn(
															"h-4 px-1.5 py-0 text-[10px]",
															statusPendaftaranColorMap[
																StatusPendaftaran.TRIAL
															],
														)}
													>
														{formatStatus(StatusPendaftaran.TRIAL)}
													</Badge>
												)}
												{row.statusPendaftaran ===
													StatusPendaftaran.OFF_SEMENTARA && (
													<Badge
														className={cn(
															"h-4 px-1.5 py-0 text-[10px]",
															statusPendaftaranColorMap[
																StatusPendaftaran.OFF_SEMENTARA
															],
														)}
													>
														{formatStatus(StatusPendaftaran.OFF_SEMENTARA)}
													</Badge>
												)}
											</div>
										</TableCell>

										{columnData.map((col) => {
											const status = row.attendance[col.sesiId] ?? null;
											const { text } = getBadgeContent(status);
											return (
												<TableCell key={col.sesiId} className="p-1 text-center">
													<span
														className={cn(
															"inline-flex h-7 w-9 items-center justify-center rounded-md text-xs font-semibold",
															kotakStatus(status),
														)}
													>
														{text}
													</span>
												</TableCell>
											);
										})}
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>
				</div>
			</div>
		</TooltipProvider>
	);
}