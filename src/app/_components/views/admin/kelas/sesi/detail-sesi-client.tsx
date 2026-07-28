"use client";

import { StatusAbsenMurid, StatusPendaftaran } from "@prisma/client";
import type { RowInput } from "jspdf-autotable";
import {
	AlertCircle,
	ArrowLeft,
	Check,
	Edit,
	FileText,
	Loader2,
	Trash2,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { HeaderActionPortal } from "@/app/_components/shared/header-action-portal";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { api } from "@/trpc/react";
import { formatToWITA } from "@/utils/dateUtils";
import { formatStatus, statusPendaftaranColorMap } from "@/utils/statusUtils";
import EditSesiDialog from "./edit-sesi-dialog";
import TambahSesiPertemuan from "./tambah-sesi-pertemuan";

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

export default function DetailSesiClient() {
	const { kelasId } = useParams<{ kelasId: string }>();

	// Dialog State
	const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
	const [editingSesiId, setEditingSesiId] = useState<string | null>(null);
	const [initialEditDate, setInitialEditDate] = useState<Date | null>(null);

	// Delete Alert State
	const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
	const [deletingSesiId, setDeletingSesiId] = useState<string | null>(null);

	// 1. Ambil data summary menggunakan hook
	const {
		dataSummary,
		isLoadingSummary,
		isErrorSummary,
		errorSummary,
		mutations,
		invalidate,
	} = useSesiPertemuan({
		kelasId: kelasId,
	});

	// Mutation untuk update Absensi
	const updateAbsensiMutation =
		api.absenMurid.createOrUpdateAbsensi.useMutation({
			onSuccess: async () => {
				await invalidate();
				toast.success("Absensi berhasil diperbarui");
			},
			onError: (error) => {
				toast.error(`Gagal update absensi: ${error.message}`);
			},
		});

	// -- HANDLERS --

	const handleEditDateClick = (sesiId: string, currentDate: Date) => {
		setEditingSesiId(sesiId);
		setInitialEditDate(currentDate);
		setIsEditDialogOpen(true);
	};

	const handleDeleteClick = (sesiId: string) => {
		setDeletingSesiId(sesiId);
		setIsDeleteAlertOpen(true);
	};

	const handleConfirmDelete = async () => {
		if (!deletingSesiId) return;
		try {
			await mutations.delete.mutateAsync({ id: deletingSesiId });
			setIsDeleteAlertOpen(false);
			setDeletingSesiId(null);
		} catch (_error) {
			// Error handled in hook
		}
	};

	const handleAttendanceChange = (
		sesiId: string,
		studentId: string,
		status: StatusAbsenMurid,
	) => {
		updateAbsensiMutation.mutate({
			sesiId,
			muridId: studentId,
			status,
		});
	};

	const handleExportAbsensi = async () => {
		if (!dataSummary) return;

		try {
			const { default: jsPDF } = await import("jspdf");
			const { default: autoTable } = await import("jspdf-autotable");

			const { kelasInfo, columnData, rowData } = dataSummary;

			const doc = new jsPDF({
				orientation: "landscape",
				format: "a4",
			});

			const BRAND_COLOR: [number, number, number] = [0, 159, 134]; // #009F86
			const pageWidth = doc.internal.pageSize.getWidth();
			const margin = 10;
			const nameColWidth = 42;

			// Batasi nama guru maksimal 20 karakter di header PDF biar rapi
			const truncateText = (text: string, maxLength: number) =>
				text.length > maxLength
					? `${text.slice(0, maxLength - 1).trimEnd()}…`
					: text;

			// ── Bagi sesi jadi beberapa "halaman" (chunk) kalau kolomnya
			// kebanyakan sehingga tidak muat ke samping dalam 1 halaman.
			// Setiap chunk tetap menampilkan kolom "Nama Siswa" di kiri,
			// jadi mudah dibaca meski dipisah per halaman.
			const availableWidth = pageWidth - margin * 2 - nameColWidth;
			const minColWidth = 15; // mm — batas minimum supaya teks tidak dempet
			const sessionsPerPage = Math.max(
				1,
				Math.floor(availableWidth / minColWidth),
			);

			const chunks: (typeof columnData)[] = [];
			for (let i = 0; i < columnData.length; i += sessionsPerPage) {
				chunks.push(columnData.slice(i, i + sessionsPerPage));
			}
			const totalPages = chunks.length;
			const cetakPada = formatToWITA(new Date(), "dddd, D MMMM YYYY HH:mm");

			chunks.forEach((chunkCols, chunkIdx) => {
				if (chunkIdx > 0) doc.addPage();

				// ── Header dokumen: kartu ringan, sudut membulat, tidak mentok tepi ──
				const headerY = 8;
				const headerH = 16;

				doc.setFillColor(236, 253, 249); // tint teal sangat muda
				doc.setDrawColor(...BRAND_COLOR);
				doc.setLineWidth(0.4);
				doc.roundedRect(
					margin,
					headerY,
					pageWidth - margin * 2,
					headerH,
					2.5,
					2.5,
					"FD",
				);

				// Aksen garis kecil di kiri judul
				doc.setFillColor(...BRAND_COLOR);
				doc.roundedRect(
					margin + 4,
					headerY + 3.5,
					1.6,
					headerH - 7,
					0.8,
					0.8,
					"F",
				);

				doc.setTextColor(30, 41, 59); // slate-800, bukan hitam pekat
				doc.setFontSize(13);
				doc.setFont("helvetica", "bold");
				doc.text(
					`Presensi Kelas: ${kelasInfo.kodeKelas}`,
					margin + 9,
					headerY + 7,
				);

				doc.setFontSize(8.5);
				doc.setFont("helvetica", "normal");
				doc.setTextColor(100, 116, 139); // slate-500
				doc.text(
					`Guru Aktif: ${truncateText(kelasInfo.guruAktif, 100)}`,
					margin + 9,
					headerY + 12.5,
				);

				doc.setFontSize(8);
				doc.text(
					`Halaman ${chunkIdx + 1} dari ${totalPages}  ·  Sesi ${
						chunkIdx * sessionsPerPage + 1
					}–${chunkIdx * sessionsPerPage + chunkCols.length} dari ${
						columnData.length
					}`,
					pageWidth - margin - 4,
					headerY + 9.5,
					{ align: "right" },
				);

				doc.setTextColor(0, 0, 0);

				// Row 1: Hari & Tanggal (RABU 04/02)
				const headerRow1 = [
					{
						content: "Nama Siswa",
						rowSpan: 3,
						styles: { halign: "left" as const, valign: "middle" as const },
					},
					...chunkCols.map((col) => {
						const hari = formatToWITA(col.tanggal, "dddd").toUpperCase();
						const tgl = formatToWITA(col.tanggal, "DD/MM");
						return `${hari}\n${tgl}`;
					}),
				];

				// Row 2: Pertemuan Ke (Pertemuan 1)
				const headerRow2 = chunkCols.map((col) => `${col.pertemuanKe}`);

				// Row 3: Pengajar (maksimal 20 karakter, bukan cuma kata pertama —
				// supaya nama dengan gelar seperti "Dr." tidak kepotong jadi "Dr." doang)
				const headerRow3 = chunkCols.map((col) =>
					truncateText(col.pengajar, 20),
				);

				const head: RowInput[] = [headerRow1, headerRow2, headerRow3];

				const body = rowData.map((row) => {
					const cellData = [row.namaSiswa];
					chunkCols.forEach((col) => {
						const status = row.attendance[col.sesiId];
						const { text } = getBadgeContent(status ?? null);
						cellData.push(text);
					});
					return cellData;
				});

				const sessionsInChunk = chunkCols.length;
				const dynamicFontSize =
					sessionsInChunk > 12 ? 7 : sessionsInChunk > 8 ? 7.5 : 8.5;
				const dynamicPadding = sessionsInChunk > 12 ? 1.4 : 2;

				autoTable(doc, {
					head,
					body,
					startY: headerY + headerH + 5,
					margin: { left: margin, right: margin },
					theme: "grid",
					styles: {
						fontSize: dynamicFontSize,
						cellPadding: dynamicPadding,
						overflow: "linebreak",
						halign: "center",
						valign: "middle",
						lineColor: [230, 235, 240],
						lineWidth: 0.1,
						textColor: [51, 65, 85], // slate-700, lebih kalem dari hitam
					},
					headStyles: {
						fillColor: [230, 250, 246], // tint teal muda, bukan navy pekat
						textColor: [15, 90, 79], // teal gelap untuk kontras teks
						halign: "center",
						valign: "middle",
						fontSize: dynamicFontSize,
						cellPadding: dynamicPadding,
						fontStyle: "bold",
						lineColor: [200, 230, 224],
					},
					alternateRowStyles: {
						fillColor: [250, 251, 252],
					},
					columnStyles: {
						0: {
							halign: "left",
							cellWidth: nameColWidth,
							fontStyle: "bold",
							fontSize: dynamicFontSize + 0.5,
							fillColor: [255, 255, 255],
							textColor: [30, 41, 59],
						},
					},
					didParseCell: (data) => {
						// Apply styling headers manually if needed
						if (data.section === "head") {
							if (data.row.index === 0 && data.column.index > 0) {
								// Top row styling (Hari/Tgl)
								data.cell.styles.fontStyle = "bold";
							}
						}

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
					didDrawPage: () => {
						// ── Footer: legenda status + nomor halaman ────────────
						const pageH = doc.internal.pageSize.getHeight();

						doc.setDrawColor(226, 232, 240);
						doc.setLineWidth(0.2);
						doc.line(margin, pageH - 12, pageWidth - margin, pageH - 12);

						doc.setFontSize(7.5);
						doc.setTextColor(100, 116, 139);
						doc.setFont("helvetica", "normal");
						doc.text(
							"Keterangan: H = Hadir · A = Alpa · Off = Off Sementara",
							margin,
							pageH - 7,
						);
						doc.text(`Dicetak: ${cetakPada}`, margin, pageH - 3);

						doc.text(
							`Halaman ${chunkIdx + 1} / ${totalPages}`,
							pageWidth - margin,
							pageH - 5,
							{ align: "right" },
						);
					},
				});
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

	// 4. Empty State (Data ada tapi tidak ada sesi)
	if (!dataSummary || dataSummary.columnData.length === 0) {
		return (
			<>
				<HeaderActionPortal>
					<div className="flex items-center gap-2">
						<Button variant="outline" size="sm" asChild>
							<Link href={`/admin/kelas/detail/${kelasId}`}>
								<ArrowLeft className="mr-2 h-4 w-4" />
								<span className="hidden sm:inline">
									Kembali ke Detail Kelas
								</span>
								<span className="sm:hidden">Detail</span>
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
					<TambahSesiPertemuan
						kelasId={kelasId}
						cabangId={dataSummary?.kelasInfo?.cabangId}
					/>
				</Card>
			</>
		);
	}

	const { kelasInfo, columnData, rowData } = dataSummary;

	// 5. Success State (Render Tabel)
	return (
		<TooltipProvider delayDuration={150}>
			<HeaderActionPortal>
				<div className="flex items-center gap-2">
					<Button variant="outline" size="sm" asChild>
						<Link href={`/admin/kelas/detail/${kelasId}`}>
							<ArrowLeft className="mr-2 h-4 w-4" />
							<span className="hidden sm:inline">Kembali ke Detail Kelas</span>
							<span className="sm:hidden">Detail</span>
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
						<CardTitle>Detail Sesi: {kelasInfo.kodeKelas}</CardTitle>
						<CardDescription>
							Guru Aktif Saat Ini:{" "}
							<span className="text-foreground font-medium">
								{kelasInfo.guruAktif}
							</span>
						</CardDescription>
					</div>
					<TambahSesiPertemuan
						kelasId={kelasId}
						cabangId={kelasInfo.cabangId}
					/>
				</CardHeader>
				<CardContent>
					<div className="overflow-x-auto rounded-md border pb-4">
						<Table className="min-w-max">
							<TableHeader>
								{/* --- Baris Header 1: Tanggal --- */}
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
											className="p-0 text-center align-top relative group"
										>
											<div className="flex flex-col items-center justify-center pt-2 gap-1 border-b pb-1">
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

												{/* Edit & Delete Buttons */}
												<div className="flex flex-row gap-0.5">
													<Button
														variant="ghost"
														size="icon"
														className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
														onClick={() =>
															handleEditDateClick(
																col.sesiId,
																new Date(col.tanggal),
															)
														}
													>
														<Edit className="h-3 w-3" />
													</Button>
													<Button
														variant="ghost"
														size="icon"
														className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
														onClick={() => handleDeleteClick(col.sesiId)}
													>
														<Trash2 className="h-3 w-3" />
													</Button>
												</div>
											</div>
										</TableHead>
									))}
								</TableRow>

								{/* --- Baris Header 2: Pertemuan Ke --- */}
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

								{/* --- Baris Header 3: Pengajar --- */}
								<TableRow>
									{columnData.map((col) => (
										<TableHead
											key={col.sesiId}
											className="text-center text-xs font-medium max-w-[90px] overflow-hidden"
										>
											<Tooltip>
												<TooltipTrigger asChild>
													<span className="block max-w-[90px] truncate mx-auto cursor-help">
														{col.pengajar}
													</span>
												</TooltipTrigger>
												<TooltipContent>{col.pengajar}</TooltipContent>
											</Tooltip>
										</TableHead>
									))}
								</TableRow>
							</TableHeader>
							<TableBody>
								{rowData.map((row) => (
									<TableRow key={row.studentId}>
										{/* Kolom Nama Siswa (Sticky) */}
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
												{row.statusPendaftaran ===
													StatusPendaftaran.OFF_SEMENTARA && (
													<Badge
														className={cn(
															"text-[10px] px-1.5 py-0 h-4",
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

										{/* Kolom Absensi (Dinamis) */}
										{columnData.map((col) => {
											const status = row.attendance[col.sesiId];
											const { text, variant } = getBadgeContent(status ?? null);

											const isUpdating =
												updateAbsensiMutation.isPending &&
												updateAbsensiMutation.variables?.sesiId ===
													col.sesiId &&
												updateAbsensiMutation.variables?.muridId ===
													row.studentId;

											return (
												<TableCell key={col.sesiId} className="text-center p-1">
													<DropdownMenu>
														<DropdownMenuTrigger asChild>
															<Button
																variant={variant}
																className={`h-7 w-9 p-0 text-xs ${status === null ? "opacity-50" : ""}`}
																disabled={isUpdating}
															>
																{isUpdating ? (
																	<Loader2 className="h-3 w-3 animate-spin" />
																) : (
																	text
																)}
															</Button>
														</DropdownMenuTrigger>
														<DropdownMenuContent align="center">
															<DropdownMenuItem
																onClick={() =>
																	handleAttendanceChange(
																		col.sesiId,
																		row.studentId,
																		StatusAbsenMurid.HADIR,
																	)
																}
															>
																<div className="flex items-center gap-2">
																	<Badge
																		variant="default"
																		className="w-5 justify-center"
																	>
																		H
																	</Badge>{" "}
																	Hadir
																	{status === StatusAbsenMurid.HADIR && (
																		<Check className="h-3 w-3 ml-auto" />
																	)}
																</div>
															</DropdownMenuItem>
															<DropdownMenuItem
																onClick={() =>
																	handleAttendanceChange(
																		col.sesiId,
																		row.studentId,
																		StatusAbsenMurid.ALPA,
																	)
																}
															>
																<div className="flex items-center gap-2">
																	<Badge
																		variant="destructive"
																		className="w-5 justify-center"
																	>
																		A
																	</Badge>{" "}
																	Alpa
																	{status === StatusAbsenMurid.ALPA && (
																		<Check className="h-3 w-3 ml-auto" />
																	)}
																</div>
															</DropdownMenuItem>
															<DropdownMenuItem
																onClick={() =>
																	handleAttendanceChange(
																		col.sesiId,
																		row.studentId,
																		StatusAbsenMurid.OFF_SEMENTARA,
																	)
																}
															>
																<div className="flex items-center gap-2">
																	<Badge
																		variant="secondary"
																		className="w-5 justify-center"
																	>
																		O
																	</Badge>{" "}
																	Off
																	{status ===
																		StatusAbsenMurid.OFF_SEMENTARA && (
																		<Check className="h-3 w-3 ml-auto" />
																	)}
																</div>
															</DropdownMenuItem>
														</DropdownMenuContent>
													</DropdownMenu>
												</TableCell>
											);
										})}
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>
				</CardContent>

				{/* Dialog Edit Sesi (Pindahan) */}
				<EditSesiDialog
					open={isEditDialogOpen}
					onOpenChange={setIsEditDialogOpen}
					sesiId={editingSesiId}
					initialDate={initialEditDate}
					kelasId={kelasId}
				/>

				{/* Alert Dialog Konfirmasi Hapus Sesi */}
				<AlertDialog
					open={isDeleteAlertOpen}
					onOpenChange={setIsDeleteAlertOpen}
				>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>Hapus Sesi Pertemuan?</AlertDialogTitle>
							<AlertDialogDescription>
								Tindakan ini tidak dapat dibatalkan. Sesi pertemuan beserta
								seluruh data absensi di dalamnya akan dihapus secara permanen.
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel disabled={mutations.delete.isPending}>
								Batal
							</AlertDialogCancel>
							<AlertDialogAction
								onClick={handleConfirmDelete}
								disabled={mutations.delete.isPending}
								className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
							>
								{mutations.delete.isPending ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Menghapus...
									</>
								) : (
									"Ya, Hapus"
								)}
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			</Card>
		</TooltipProvider>
	);
}
