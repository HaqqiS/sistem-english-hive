"use client";

import {
	AlertCircle,
	CalendarDays,
	CalendarIcon,
	FileSpreadsheet,
	Users,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { DataTable } from "@/app/_components/shared/data-table-generic";
import { HeaderActionPortal } from "@/app/_components/shared/header-action-portal";
import TambahAbsensiManual from "@/app/_components/views/admin/guru/drawer/tambah-absensi-manual";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { useAbsenGuru } from "@/hooks/useAbsenGuru";
import { useUser } from "@/hooks/useUser";
import {
	calculateTotalGaji,
	GAJI_PER_SESI,
	getPeriodeGaji,
} from "@/server/services/gaji.service";
import { useGlobalCabangStore } from "@/store/useGlobalCabangStore";
import dayjs, { formatToWITA } from "@/utils/dateUtils";
import { downloadExcel } from "@/utils/exportUtils";
import { toRupiah } from "@/utils/toRupiah";
import { columns } from "../columns/columns-detail-absen-guru";

export default function DetailGuruClient() {
	const { guruId } = useParams<{ guruId: string }>();
	const { activeCabangId } = useGlobalCabangStore();
	const [open, setOpen] = useState(false);

	// State untuk menyimpan bulan gaji yang dipilih (misal: November 2025)
	const [month, setMonth] = useState<Date | undefined>(new Date());
	const selectedMonthYYYYMM = dayjs(month).format("YYYY-MM");

	// Helper untuk menampilkan text periode (Tgl 26 Prev - 25 Curr) di UI
	const periodeText = useMemo(() => {
		const { startDate, endDate } = getPeriodeGaji(selectedMonthYYYYMM);
		return `${dayjs(startDate).format("D MMM")} - ${dayjs(endDate).format(
			"D MMM YYYY",
		)}`;
	}, [selectedMonthYYYYMM]);

	// 1. Query untuk mendapatkan nama guru
	const { dataGuruList: dataGuru, isLoadingGuruList: isLoadingGuru } = useUser({
		filterCabang: activeCabangId,
	});

	// 2. Query history (Backend sudah handle filter tgl 26-25)
	const {
		dataHistory,
		isLoadingHistory,
		isErrorHistory,
		errorHistory,
		refetchHistory,
		fetchHistoryExport,
	} = useAbsenGuru({
		filterCabang: activeCabangId,
		guruId,
		month: selectedMonthYYYYMM,
		enableQuery: !!guruId && !!month,
	});

	const guruName = useMemo(() => {
		return dataGuru?.find((g) => g.id === guruId)?.name ?? "Guru";
	}, [dataGuru, guruId]);

	// 3. Hitung total gaji menggunakan logic yang sama dengan service (atau panggil logic service jika perlu)
	const { totalAbsen, totalGaji } = useMemo(() => {
		if (!dataHistory) return { totalAbsen: 0, totalGaji: 0 };

		// Kita bisa pakai helper dari service agar logic tetap 1 sumber
		const { totalHadir, totalGaji } = calculateTotalGaji(dataHistory);

		return { totalAbsen: totalHadir, totalGaji };
	}, [dataHistory]);

	const handleExport = async () => {
		const toastId = toast.loading("Menyiapkan slip gaji...");
		try {
			const data = await fetchHistoryExport();

			if (!data || data.length === 0) {
				toast.error("Tidak ada data kehadiran untuk bulan ini.", {
					id: toastId,
				});
				return;
			}

			// Format Data untuk CSV (Slip Gaji)
			const csvData = data.map((item) => ({
				Tanggal: formatToWITA(
					item.sesiPertemuanKelas.tanggalWaktu,
					"DD/MM/YYYY",
				),
				Jam: formatToWITA(item.sesiPertemuanKelas.tanggalWaktu, "HH:mm"),
				Kelas: item.sesiPertemuanKelas.kelas.kodeKelas,
				Ruang: item.sesiPertemuanKelas.ruang.namaRuang,
				Status: item.status, // HADIR/SAKIT/IJIN
				"Rate (Rp)": item.status === "HADIR" ? GAJI_PER_SESI : 0, // Honor per sesi
				Verifikasi: item.isVerified ? "Terverifikasi" : "Pending",
			}));

			const filename = `SlipGaji-${guruName}-${selectedMonthYYYYMM}`;
			downloadExcel(csvData, filename);

			toast.success("Slip Gaji berhasil diunduh!", { id: toastId });
		} catch (e) {
			console.error(e);
			toast.error("Gagal mengunduh data.", { id: toastId });
		}
	};

	if (isLoadingGuru || isLoadingHistory) {
		return (
			<div className="space-y-4">
				<Skeleton className="h-40 w-full" />
				<Skeleton className="h-64 w-full" />
			</div>
		);
	}

	// if (isErrorHistory) {
	// 	return (
	// 		<Alert variant="destructive">
	// 			<AlertCircle className="h-4 w-4" />
	// 			<AlertTitle>Gagal Memuat Data</AlertTitle>
	// 			<AlertDescription>{errorHistory?.message}</AlertDescription>
	// 		</Alert>
	// 	);
	// }

	return (
		<div className="space-y-4">
			<HeaderActionPortal>
				<TambahAbsensiManual defaultGuruId={guruId} />
				<Button variant="ghost" size="sm" onClick={handleExport}>
					<FileSpreadsheet className="mr-2 h-4 w-4" />
					Export Slip Gaji
				</Button>
			</HeaderActionPortal>

			<header className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
				<div>
					<h1 className="text-xl font-bold">Gaji Guru: {guruName}</h1>
					<p className="text-muted-foreground mt-1 flex items-center gap-1 text-sm">
						<CalendarDays className="h-3 w-3" />
						Periode:{" "}
						<span className="text-foreground font-medium">{periodeText}</span>
					</p>
				</div>

				{/* Filter Bulan Gaji */}
				<div className="flex flex-col gap-1">
					<span className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">
						Pilih Bulan Gaji
					</span>
					<Popover open={open} onOpenChange={setOpen}>
						<PopoverTrigger asChild>
							<Button
								variant="outline"
								className="w-full justify-start text-left font-normal md:w-60"
							>
								<CalendarIcon className="mr-2 h-4 w-4" />
								{dayjs(month).format("MMMM YYYY")}
							</Button>
						</PopoverTrigger>
						<PopoverContent className="w-full p-0" align="end">
							<Calendar
								mode="single"
								month={month}
								onMonthChange={(newMonth) => {
									if (newMonth) {
										setMonth(newMonth);
										setOpen(false);
									}
								}}
								captionLayout="dropdown"
								startMonth={new Date(2024, 0)}
								endMonth={new Date(dayjs().year() + 1, 11)}
								classNames={{
									month: "space-y-0 space-x-5 h-8",
									caption: "relative flex justify-center items-center pt-1",
									day: "hidden",
									weekdays: "hidden",
								}}
							/>
						</PopoverContent>
					</Popover>
				</div>
			</header>

			{/* Kartu Rangkuman Gaji */}
			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-sm font-medium">
						Slip Gaji Bulan {dayjs(month).format("MMMM")}
					</CardTitle>
					<span className="text-muted-foreground bg-muted rounded px-2 py-1 text-xs">
						Rate: {toRupiah(GAJI_PER_SESI)} / Sesi
					</span>
				</CardHeader>
				<CardContent className="grid grid-cols-1 gap-4 pt-4 md:grid-cols-2">
					{/* Total Sesi */}
					<div className="bg-background/50 rounded-lg border p-4">
						<div className="flex items-center justify-between">
							<p className="text-muted-foreground text-sm font-medium">
								Total Kehadiran
							</p>
							<Users className="text-primary h-4 w-4" />
						</div>
						<div className="mt-2 text-2xl font-bold">{totalAbsen} Sesi</div>
						<p className="text-muted-foreground mt-1 text-xs">
							Jumlah sesi status &quot;HADIR&quot; dalam periode {periodeText}
						</p>
					</div>

					{/* Total Gaji */}
					<div className="border-primary/20 bg-primary/5 rounded-lg border p-4">
						<div className="flex items-center justify-between">
							<p className="text-primary text-sm font-medium">
								Total Gaji Diterima
							</p>
							<span className="text-primary text-lg font-bold">Rp</span>
						</div>
						<div className="text-primary mt-2 text-2xl font-bold">
							{toRupiah(totalGaji)}
						</div>
						<p className="text-muted-foreground mt-1 text-xs">
							{totalAbsen} Sesi x {toRupiah(GAJI_PER_SESI)}
						</p>
					</div>
				</CardContent>

				<CardFooter>
					<Button
						variant="ghost"
						size="sm"
						className="text-muted-foreground ml-auto text-xs"
						onClick={() => refetchHistory()}
						disabled={isLoadingHistory}
					>
						Refresh Data
					</Button>
				</CardFooter>
			</Card>

			{/* Rekap Per Kelas (TINYTODS 1-L | 01/2026 7x) */}
			{dataHistory && dataHistory.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle className="text-sm font-medium">
							Rekap Absensi Per Kelas
						</CardTitle>
						<CardDescription className="text-xs">
							Ringkasan jumlah pertemuan hadir berdasarkan kode kelas.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
							{(() => {
								const groups: Record<
									string,
									{
										kodeKelas: string;
										count: number;
									}
								> = {};

								dataHistory.forEach((item) => {
									if (item.status !== "HADIR") return;

									const kelas = item.sesiPertemuanKelas.kelas;
									const kode = kelas.kodeKelas;

									if (!groups[kode]) {
										groups[kode] = {
											kodeKelas: kode,
											count: 0,
										};
									}
									groups[kode].count++;
								});

								return Object.values(groups).map((group) => (
									<div
										key={group.kodeKelas}
										className="bg-muted/50 flex items-center justify-between rounded-md border px-3 py-2 text-xs font-medium"
									>
										<span className="font-semibold">{group.kodeKelas}</span>
										<span className="font-bold text-blue-600">
											{group.count}x
										</span>
									</div>
								));
							})()}
						</div>
					</CardContent>
				</Card>
			)}

			{/* Tabel History Absensi */}
			<Card>
				<CardHeader>
					<CardTitle>Rincian Absensi</CardTitle>
					<CardDescription>
						Data detail pertemuan yang masuk dalam periode {periodeText}.
					</CardDescription>
				</CardHeader>
				<CardContent>
					{isErrorHistory ? (
						<Alert variant="destructive">
							<AlertCircle className="h-4 w-4" />
							<AlertTitle>Gagal Memuat Data</AlertTitle>
							<AlertDescription>{errorHistory?.message}</AlertDescription>
						</Alert>
					) : (
						<DataTable columns={columns} data={dataHistory ?? []} />
					)}
				</CardContent>
			</Card>
		</div>
	);
}
