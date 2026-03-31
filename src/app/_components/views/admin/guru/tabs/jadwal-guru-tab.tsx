"use client";

import dayjs from "dayjs";
import { AlertCircle, Download } from "lucide-react";
import { useMemo } from "react";
import { utils, writeFile } from "xlsx";
import { HeaderActionPortal } from "@/app/_components/shared/header-action-portal";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { useUser } from "@/hooks/useUser";

const DAYS = [
	"SENIN",
	"SELASA",
	"RABU",
	"KAMIS",
	"JUMAT",
	"SABTU",
	"MINGGU",
] as const;

interface JadwalGuruTabProps {
	cabangId?: string;
}

const getJadwalGuruStatusTheme = (status?: string | null) => {
	switch (status) {
		case "TRIAL":
			return "border-l-purple-500 bg-purple-50 text-purple-900 dark:bg-purple-900/20 dark:text-purple-100";
		case "WAITING":
			return "border-l-yellow-500 bg-yellow-50 text-yellow-900 dark:bg-yellow-900/20 dark:text-yellow-100";
		case "LEVEL_UP":
			return "border-l-teal-500 bg-teal-50 text-teal-900 dark:bg-teal-900/20 dark:text-teal-100";
		case "COMPLETED":
			return "border-l-slate-500 bg-slate-50 text-slate-900 dark:bg-slate-900/20 dark:text-slate-100";
		case "RUNNING":
			return "border-l-primary bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary";
	}
};

export default function JadwalGuruTab({ cabangId }: JadwalGuruTabProps) {
	const {
		dataJadwalMatrix: data,
		isLoadingJadwalMatrix: isLoading,
		isErrorJadwalMatrix: isError,
	} = useUser({
		filterCabang: cabangId,
		enableJadwalMatrixQuery: true,
	});

	const processedData = useMemo(() => {
		if (!data) return [];
		const { gurus, jamTetap } = data;

		return gurus.map((guru) => {
			// 1. Collect all custom slots for this guru
			const customSlots = new Map<
				string,
				{ jamMulai: string; jamSelesai: string; isCustom: boolean }
			>();

			// Add standard slots first
			jamTetap.forEach((jt) => {
				const key = `${jt.jamMulai}-${jt.jamSelesai}`;
				if (!customSlots.has(key)) {
					customSlots.set(key, {
						jamMulai: jt.jamMulai,
						jamSelesai: jt.jamSelesai,
						isCustom: false,
					});
				}
			});

			// Add custom slots found in guru's schedule
			guru.historyGuruKelases.forEach((history) => {
				history.kelas.jadwalKelas.forEach((jadwal) => {
					if (jadwal.jamSlotCustom) {
						const { jamMulai, jamSelesai } = jadwal.jamSlotCustom;
						const key = `${jamMulai}-${jamSelesai}`;
						if (!customSlots.has(key)) {
							customSlots.set(key, { jamMulai, jamSelesai, isCustom: true });
						}
					}
				});
			});

			// Sort slots
			const sortedSlots = Array.from(customSlots.values()).sort((a, b) =>
				a.jamMulai.localeCompare(b.jamMulai),
			);

			// Prepare grid data
			const rows = sortedSlots.map((slot) => {
				const dayCells = DAYS.map((day) => {
					// Find class for this slot & day
					const foundClass = guru.historyGuruKelases
						.flatMap((h) =>
							h.kelas.jadwalKelas.map((j) => ({
								...j,
								kodeKelas: h.kelas.kodeKelas,
								statusKelas: h.kelas.statusKelas,
								kelasId: h.kelas.id,
							})),
						)
						.find((j) => {
							// Match Day
							if (j.hari !== day) return false;

							// Match Time
							if (j.jamSlotTetap) {
								return (
									j.jamSlotTetap.jamMulai === slot.jamMulai &&
									j.jamSlotTetap.jamSelesai === slot.jamSelesai
								);
							} else if (j.jamSlotCustom) {
								return (
									j.jamSlotCustom.jamMulai === slot.jamMulai &&
									j.jamSlotCustom.jamSelesai === slot.jamSelesai
								);
							}
							return false;
						});

					return foundClass
						? {
								kodeKelas: foundClass.kodeKelas,
								status: foundClass.statusKelas,
							}
						: null;
				});

				return {
					slot,
					cells: dayCells,
				};
			});

			return {
				guru,
				rows,
			};
		});
	}, [data]);

	const handleExportExcel = () => {
		if (processedData.length === 0) return;

		const headers = ["Nama Guru", "Jam", ...DAYS];
		const excelData = [headers];

		processedData.forEach((item) => {
			item.rows.forEach((row, index) => {
				const excelRow = [
					index === 0 ? (item.guru.name ?? "Guru") : "", // Guru name in first row
					`${row.slot.jamMulai} - ${row.slot.jamSelesai}`,
					...row.cells.map((cell) =>
						cell ? `${cell.kodeKelas} (${cell.status ?? "-"})` : "-",
					),
				];
				excelData.push(excelRow);
			});
		});

		const worksheet = utils.aoa_to_sheet(excelData);
		const workbook = utils.book_new();
		utils.book_append_sheet(workbook, worksheet, "Jadwal Guru");

		// Auto-size columns (rough implementation)
		const colWidths = excelData[0]?.map((_, i) => ({
			wch: Math.max(...excelData.map((row) => row[i]?.toString().length ?? 10)),
		}));
		worksheet["!cols"] = colWidths;

		const branchName = data?.gurus?.[0]?.cabang?.namaCabang ?? "English_Hive";
		const dateStr = dayjs().format("YYYY-MM-DD");
		const filename = `Jadwal_Guru_${branchName.replace(/\s+/g, "_")}_${dateStr}.xlsx`;

		writeFile(workbook, filename);
	};

	if (isLoading) {
		return (
			<div className="space-y-4">
				<Skeleton className="h-10 w-full" />
				<Skeleton className="h-40 w-full" />
			</div>
		);
	}

	if (isError) {
		return (
			<div className="flex min-h-[300px] flex-col items-center justify-center gap-3 rounded-md border bg-background p-8 text-center">
				<div className="rounded-full bg-destructive/10 p-3">
					<AlertCircle className="text-destructive h-6 w-6" />
				</div>
				<div className="space-y-1">
					<h3 className="text-lg font-semibold">Gagal Memuat Jadwal</h3>
					<p className="text-muted-foreground mx-auto max-w-sm text-sm">
						Harap pilih spesifik cabang (bukan "Semua Cabang") untuk melihat
						Kalender Jadwal Guru.
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<HeaderActionPortal>
				<Button
					variant="ghost"
					size="sm"
					onClick={handleExportExcel}
					disabled={processedData.length === 0}
					className="flex items-center gap-2"
				>
					<Download className="h-4 w-4" />
					Export Excel
				</Button>
			</HeaderActionPortal>

			<div className="flex items-center justify-between">
				<h2 className="text-lg font-semibold tracking-tight">
					Grid Jadwal Guru
				</h2>
			</div>

			<div className="rounded-md border bg-background overflow-auto h-[calc(100vh-250px)] relative">
				<table className="w-full caption-bottom text-sm">
					<TableHeader className="sticky top-0 z-40 bg-muted shadow-sm">
						<TableRow className="hover:bg-muted">
							<TableHead className="w-[150px] border-r bg-muted sticky top-0 left-0 z-50">
								Nama Guru
							</TableHead>
							<TableHead className="w-[120px] border-r border-dotted bg-muted sticky top-0 left-[150px] z-50 shadow-[1px_0_0_0_rgba(0,0,0,0.1)]">
								Jam
							</TableHead>
							{DAYS.map((day) => (
								<TableHead
									key={day}
									className="text-center border-r last:border-r-0 bg-muted sticky top-0 z-40"
								>
									{day}
								</TableHead>
							))}
						</TableRow>
					</TableHeader>
					<TableBody>
						{processedData.map((item) =>
							item.rows.map((row, index) => (
								<TableRow key={`${item.guru.id}-${index}`}>
									{/* Guru Name Column - Merged */}
									{index === 0 && (
										<TableCell
											rowSpan={item.rows.length}
											className="font-medium border-r sticky top-[41px] left-0 z-30 bg-background/95 align-top p-0 min-w-[150px]"
										>
											<div className="p-4 sticky top-[41px] left-0">
												{item.guru.name}
											</div>
										</TableCell>
									)}

									{/* Time Slot */}
									<TableCell className="text-sm text-muted-foreground border-r border-dotted font-mono whitespace-nowrap sticky left-[150px] z-20 bg-background shadow-[1px_0_0_0_rgba(0,0,0,0.1)]">
										{row.slot.jamMulai} - {row.slot.jamSelesai}
									</TableCell>

									{row.cells.map((cellContent, dayIdx) => (
										<TableCell
											key={DAYS[dayIdx]}
											className="p-2 border-r last:border-r-0 text-center"
										>
											{cellContent ? (
												<div
													className={`flex min-w-[120px] flex-col gap-0.5 rounded-sm border-l-4 px-2 py-1.5 text-left text-xs shadow-sm transition-all hover:shadow-md ${getJadwalGuruStatusTheme(cellContent.status)}`}
												>
													<span className="font-bold tracking-tight">
														{cellContent.kodeKelas}
													</span>
													<span className="text-[10px] font-medium opacity-80">
														{cellContent.status}
													</span>
												</div>
											) : (
												<span className="text-muted-foreground/20">-</span>
											)}
										</TableCell>
									))}
								</TableRow>
							)),
						)}
						{processedData.length === 0 && (
							<TableRow>
								<TableCell colSpan={9} className="h-24 text-center">
									Tidak ada data jadwal.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</table>
			</div>
		</div>
	);
}
