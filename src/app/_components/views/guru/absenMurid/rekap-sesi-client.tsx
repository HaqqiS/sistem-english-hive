"use client";

import { StatusAbsenMurid, StatusPendaftaran } from "@prisma/client";
import type { RowInput } from "jspdf-autotable";
import { AlertCircle, ArrowLeft, FileText } from "lucide-react";
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
			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
					<div className="space-y-1">
						<CardTitle>Rekap Presensi: {kelasInfo.kodeKelas}</CardTitle>
						<CardDescription>
							Guru Aktif Saat Ini:{" "}
							<span className="text-foreground font-medium">
								{kelasInfo.guruAktif}
							</span>
						</CardDescription>
					</div>
				</CardHeader>
				<CardContent>
					<div className="overflow-x-auto rounded-md border pb-4">
						<Table className="min-w-max">
							<TableHeader>
								<TableRow>
									<TableHead
										rowSpan={3}
										className="bg-muted sticky left-0 min-w-40 border-r align-middle z-20"
									>
										Nama Siswa
									</TableHead>
									{columnData.map((col) => (
										<TableHead
											key={col.sesiId}
											className="p-0 text-center align-top relative"
										>
											<div className="flex flex-col items-center justify-center pt-2 gap-1 border-b pb-1 px-4">
												<Tooltip>
													<TooltipTrigger asChild>
														<div className="cursor-help font-semibold text-xs uppercase tracking-wider">
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
									{columnData.map((col) => (
										<TableHead
											key={col.sesiId}
											className="text-center text-xs text-muted-foreground"
										>
											{col.pertemuanKe}
										</TableHead>
									))}
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
										<TableCell className="bg-background sticky left-0 border-r font-medium text-sm z-20">
											<div className="flex items-center gap-2">
												<span>{row.namaSiswa}</span>
												{row.statusPendaftaran === StatusPendaftaran.TRIAL && (
													<Badge
														className={cn(
															"text-[10px] px-1.5 py-0 h-4",
															statusPendaftaranColorMap[
																StatusPendaftaran.TRIAL
															],
														)}
													>
														{formatStatus(StatusPendaftaran.TRIAL)}
													</Badge>
												)}
											</div>
										</TableCell>

										{columnData.map((col) => {
											const status = row.attendance[col.sesiId];
											const { text, variant } = getBadgeContent(status ?? null);

											return (
												<TableCell key={col.sesiId} className="text-center p-1">
													<Button
														variant={variant}
														className={`h-7 w-9 p-0 text-xs cursor-default ${status === null ? "opacity-50" : ""}`}
													>
														{text}
													</Button>
												</TableCell>
											);
										})}
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>
				</CardContent>
			</Card>
		</TooltipProvider>
	);
}
