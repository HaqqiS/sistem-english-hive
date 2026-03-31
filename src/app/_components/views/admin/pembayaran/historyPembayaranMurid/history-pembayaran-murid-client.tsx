"use client";

import { StatusPembayaran } from "@prisma/client";
import { pdf } from "@react-pdf/renderer";
import {
	AlertCircle,
	Banknote,
	BookOpen,
	CalendarClock,
	CreditCard,
	Download,
	Terminal,
	User,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { DataTable } from "@/app/_components/shared/data-table-generic";
import { DeleteConfirmationDialog } from "@/app/_components/shared/delete-confirmation-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePembayaran } from "@/hooks/usePembayaran";
import { useTagihanLain } from "@/hooks/useTagihanLain";
import { useGlobalCabangStore } from "@/store/useGlobalCabangStore";
import { usePembayaranStore } from "@/store/usePembayaranStore";
import type { TypePembayaran } from "@/types/pembayaran.type";
import { toRupiah } from "@/utils/toRupiah";
import { columns as createColumns } from "../columns/columns-pembayaran";
import {
	columnsTagihanLain,
	type TypeTagihanLain,
} from "../columns/columns-tagihan-lain";
import EditPembayaran from "../drawer/edit-pembayaran";
import EditTagihanLain from "../drawer/edit-tagihan-lain";
import { type ReceiptItem, ReceiptPDF } from "../receipt-pdf";

export default function HistoryPembayaranMuridClient() {
	const { activeCabangId } = useGlobalCabangStore();
	const { muridId } = useParams<{ muridId: string }>();
	const { openDrawer } = usePembayaranStore();

	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [itemToDelete, setItemToDelete] = useState<TypePembayaran | null>(null);

	// State untuk Tagihan Lain
	const [deleteTagihanLainOpen, setDeleteTagihanLainOpen] = useState(false);
	const [tagihanLainToDelete, setTagihanLainToDelete] =
		useState<TypeTagihanLain | null>(null);

	const [editTagihanLainOpen, setEditTagihanLainOpen] = useState(false);
	const [tagihanLainToEdit, setTagihanLainToEdit] =
		useState<TypeTagihanLain | null>(null);

	// 1. Hook Utama SPP
	const {
		dataGetAllPaginated, // List Pembayaran
		isLoadingGetAllPaginated,
		isErrorGetAllPaginated,
		errorGetAllPaginated,
		getSaldoByMuridIdQuery, // Query Saldo Spesifik
		mutations,
	} = usePembayaran({
		pagination: {
			pageSize: 30,
			pageIndex: 0,
		},
		enableGetAll: true,
		muridIdFilter: muridId,
		filterCabang: activeCabangId,
		onSuccessDelete: () => {
			setDeleteDialogOpen(false);
			setItemToDelete(null);
		},
	});

	// 2. Hook Tagihan Lain
	const {
		dataByMurid: dataTagihanLain,
		isLoadingByMurid: isLoadingTagihanLain,
		mutations: mutationsTagihanLain,
	} = useTagihanLain({
		muridId,
		enableGetAll: false, // Use specific query
		onSuccessDelete: () => {
			setDeleteTagihanLainOpen(false);
			setTagihanLainToDelete(null);
		},
	});

	// 3. Panggil Query Saldo (per-kelas, return { saldoList, isMultiKelas })
	const { data: saldoData, isLoading: isLoadingSaldo } = getSaldoByMuridIdQuery(
		{ muridId: muridId },
		{ enabled: !!muridId },
	);

	const saldoList = saldoData?.saldoList ?? [];
	const isMultiKelas = saldoData?.isMultiKelas ?? false;
	const activeKelasLabels = saldoList.map((s) => s.kodeKelas);

	// 4. Kelompokkan SPP per kodeKelas (client-side, hanya dipakai jika multi-kelas)
	const groupedSPP = useMemo(() => {
		if (!dataGetAllPaginated || !isMultiKelas) return [];
		const groups = new Map<string, TypePembayaran[]>();
		for (const row of dataGetAllPaginated) {
			const kode = row.pendaftaranKelas.Kelas.kodeKelas;
			if (!groups.has(kode)) groups.set(kode, []);
			const group = groups.get(kode);
			if (group) group.push(row);
		}
		return Array.from(groups.entries());
	}, [dataGetAllPaginated, isMultiKelas]);

	// --- HANDLERS SPP ---
	const handleDeleteClick = (item: TypePembayaran) => {
		setItemToDelete(item);
		setDeleteDialogOpen(true);
	};

	const handleConfirmDelete = () => {
		if (itemToDelete) {
			mutations.delete.mutate({ id: itemToDelete.id });
		}
	};

	const handleVerifyClick = (item: TypePembayaran) => {
		const newStatus =
			item.statusBayar === StatusPembayaran.LUNAS
				? StatusPembayaran.BELUM_LUNAS
				: StatusPembayaran.LUNAS;

		mutations.update.mutate({
			id: item.id,
			jumlahBayar: item.jumlahBayar,
			note: item.note ?? undefined,
			statusBayar: newStatus,
			tanggalBayar:
				newStatus === StatusPembayaran.LUNAS
					? new Date().toISOString()
					: undefined,
		});
	};

	const handleEditClick = (item: TypePembayaran) => {
		openDrawer("edit", item);
	};

	const handleDownloadSPP = async (item: TypePembayaran) => {
		try {
			const idToast = toast.loading("Membuat Kuitansi...");
			const kodeKls = item.pendaftaranKelas.Kelas.kodeKelas;

			const receiptItem: ReceiptItem = {
				id: item.id,
				judul: `SPP Bulan Ke-${item.pembayaranKe}`,
				kodeKelas: kodeKls,
				kategori: "SPP",
				jumlah: item.jumlahBayar,
				tanggalBayar: item.tanggalBayar,
			};

			const adminName = item.verifiedBy?.name ?? "Admin";
			const muridN = item.pendaftaranKelas.murid.namaLengkap;
			const cabangName =
				item.pendaftaranKelas.Kelas.cabang?.namaCabang ?? "Pusat";

			const doc = (
				<ReceiptPDF
					items={[receiptItem]}
					namaMurid={muridN}
					cabangName={cabangName}
					adminName={adminName}
				/>
			);

			const asPdf = pdf(doc);
			const blob = await asPdf.toBlob();
			const url = URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.href = url;
			link.download = `Kuitansi_SPP_${muridN}_Ke-${item.pembayaranKe}.pdf`;
			link.click();
			URL.revokeObjectURL(url);

			toast.dismiss(idToast);
			toast.success("Kuitansi berhasil diunduh");
		} catch (error) {
			console.error(error);
			toast.error("Gagal membuat kuitansi");
		}
	};

	const columns = createColumns({
		onDeleteClick: handleDeleteClick,
		onEditClick: handleEditClick,
		onVerifyClick: handleVerifyClick,
		onDownloadClick: handleDownloadSPP,
	});

	// --- HANDLERS TAGIHAN LAIN ---
	const handleDeleteTagihanLain = (item: TypeTagihanLain) => {
		setTagihanLainToDelete(item);
		setDeleteTagihanLainOpen(true);
	};

	const handleConfirmDeleteTagihanLain = () => {
		if (tagihanLainToDelete) {
			mutationsTagihanLain.delete.mutate({ id: tagihanLainToDelete.id });
		}
	};

	const handleVerifyTagihanLain = (item: TypeTagihanLain) => {
		if (item.status === StatusPembayaran.LUNAS) {
			mutationsTagihanLain.update.mutate({
				id: item.id,
				status: StatusPembayaran.BELUM_LUNAS,
			});
		} else {
			mutationsTagihanLain.markAsPaid.mutate({ id: item.id });
		}
	};

	const handleEditTagihanLain = (item: TypeTagihanLain) => {
		setTagihanLainToEdit(item);
		setEditTagihanLainOpen(true);
	};

	const handleDownloadTagihanLain = async (item: TypeTagihanLain) => {
		try {
			const idToast = toast.loading("Membuat Kuitansi...");
			const kodeKls = item.kelas?.kodeKelas ?? "-";

			const receiptItem: ReceiptItem = {
				id: item.id,
				judul: item.judul,
				kodeKelas: kodeKls,
				kategori: item.kategori,
				jumlah: item.jumlah,
				tanggalBayar: item.tanggalBayar,
			};

			const adminName = item.verifiedBy?.name ?? "Admin";
			const muridN = item.murid.namaLengkap;
			const cabangName = item.murid.cabang?.namaCabang ?? "Pusat";

			const doc = (
				<ReceiptPDF
					items={[receiptItem]}
					namaMurid={muridN}
					cabangName={cabangName}
					adminName={adminName}
				/>
			);

			const asPdf = pdf(doc);
			const blob = await asPdf.toBlob();
			const url = URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.href = url;
			link.download = `Kuitansi_${item.kategori}_${muridN}.pdf`;
			link.click();
			URL.revokeObjectURL(url);

			toast.dismiss(idToast);
			toast.success("Kuitansi berhasil diunduh");
		} catch (error) {
			console.error(error);
			toast.error("Gagal membuat kuitansi");
		}
	};

	const columnsLain = columnsTagihanLain({
		onDeleteClick: handleDeleteTagihanLain,
		onEditClick: handleEditTagihanLain,
		onVerifyClick: handleVerifyTagihanLain,
		onDownloadClick: handleDownloadTagihanLain,
	});

	const isLoading =
		isLoadingGetAllPaginated || isLoadingSaldo || isLoadingTagihanLain;

	// --- LOADING STATE ---
	if (isLoading) {
		return (
			<div className="space-y-6">
				<div className="flex items-center gap-4">
					<Skeleton className="h-10 w-10 rounded-full" />
					<div className="space-y-2">
						<Skeleton className="h-6 w-64" />
						<Skeleton className="h-4 w-40" />
					</div>
				</div>
				<div className="grid gap-4 md:grid-cols-3">
					<Skeleton className="h-32 rounded-xl" />
					<Skeleton className="h-32 rounded-xl" />
					<Skeleton className="h-32 rounded-xl" />
				</div>
				<Skeleton className="h-96 w-full rounded-xl" />
			</div>
		);
	}

	// --- ERROR STATE ---
	if (isErrorGetAllPaginated) {
		return (
			<Alert variant="destructive">
				<Terminal className="h-4 w-4" />
				<AlertTitle>Error</AlertTitle>
				<AlertDescription>
					Gagal memuat data: {errorGetAllPaginated?.message}
				</AlertDescription>
			</Alert>
		);
	}

	// --- DATA HELPERS ---
	const namaMurid =
		saldoList[0]?.muridName ??
		dataGetAllPaginated?.[0]?.pendaftaranKelas?.murid?.namaLengkap ??
		"Detail Murid";

	// Fallback kodeKelas untuk header (saat saldoList masih kosong)
	const kodeKelas =
		saldoList[0]?.kodeKelas ??
		dataGetAllPaginated?.[0]?.pendaftaranKelas?.Kelas?.kodeKelas ??
		"-";

	// Low balance check: dari kelas pertama (paling kritis)
	const sisaKuotaPertama = saldoList[0]?.sisaPertemuan ?? 0;
	const isLowBalance = sisaKuotaPertama <= 2 && saldoList.length > 0;

	return (
		<div className="space-y-6 pb-10">
			{/* --- 1. HEADER SECTION --- */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex items-center gap-3">
					<div>
						<h1 className="flex items-center gap-2 text-xl font-bold tracking-tight">
							{namaMurid}
						</h1>
						<div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
							{/* Tampilkan badge per kelas aktif jika data sudah ada */}
							{activeKelasLabels.length > 0 ? (
								activeKelasLabels.map((kode) => (
									<Badge key={kode} variant="outline" className="font-normal">
										{kode}
									</Badge>
								))
							) : (
								<Badge variant="outline" className="font-normal">
									{kodeKelas}
								</Badge>
							)}
							<span>•</span>
							<span>Riwayat Pembayaran</span>
						</div>
					</div>
				</div>
			</div>

			{/* --- 2. ALERT MULTI-KELAS (kondisional) --- */}
			{isMultiKelas && (
				<Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30">
					<AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
					<AlertTitle className="text-amber-800 dark:text-amber-300">
						Murid Terdaftar di {activeKelasLabels.length} Kelas Aktif
					</AlertTitle>
					<AlertDescription className="text-amber-700 dark:text-amber-400">
						Saldo pertemuan dihitung <strong>terpisah per kelas</strong> (
						{activeKelasLabels.join(", ")}). Pilih tab kelas di bawah untuk
						melihat detail saldo dan tagihan masing-masing.
					</AlertDescription>
				</Alert>
			)}

			{/* --- 3. SUMMARY CARDS (SALDO INFO) per kelas --- */}
			{saldoList.length > 0 &&
				(isMultiKelas ? (
					/* Tab switcher — satu tab per kelas */
					<Tabs defaultValue={saldoList[0]?.kodeKelas} className="w-full">
						<TabsList>
							{saldoList.map((s) => (
								<TabsTrigger key={s.kodeKelas} value={s.kodeKelas}>
									{s.kodeKelas}
								</TabsTrigger>
							))}
						</TabsList>
						{saldoList.map((s) => {
							const low = (s.sisaPertemuan ?? 0) <= 2;
							return (
								<TabsContent
									key={s.kodeKelas}
									value={s.kodeKelas}
									className="mt-3"
								>
									<div className="grid gap-4 md:grid-cols-3">
										<Card className={low ? "border-red-200 bg-red-50/50" : ""}>
											<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
												<CardTitle className="text-sm font-medium">
													Sisa Kuota Pertemuan
												</CardTitle>
												<CalendarClock
													className={`h-4 w-4 ${low ? "text-red-500" : "text-muted-foreground"}`}
												/>
											</CardHeader>
											<CardContent>
												<div
													className={`text-2xl font-bold ${low ? "text-red-600" : ""}`}
												>
													{s.sisaPertemuan ?? 0} Sesi
												</div>
												<p className="text-xs text-muted-foreground">
													{low
														? "Kuota menipis, segera tagih."
														: "Kuota masih aman."}
												</p>
											</CardContent>
										</Card>
										<Card>
											<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
												<CardTitle className="text-sm font-medium">
													Tagihan Berikutnya
												</CardTitle>
												<Banknote className="h-4 w-4 text-muted-foreground" />
											</CardHeader>
											<CardContent>
												<div className="text-2xl font-bold">
													Ke-{s.nextBillPembayaranKe ?? 1}
												</div>
												<p className="text-xs text-muted-foreground">
													Estimasi tagihan selanjutnya
												</p>
											</CardContent>
										</Card>
										<Card>
											<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
												<CardTitle className="text-sm font-medium">
													Total Sesi Terpakai
												</CardTitle>
												<User className="h-4 w-4 text-muted-foreground" />
											</CardHeader>
											<CardContent>
												<div className="text-2xl font-bold">
													{s.totalTerpakai ?? 0}
												</div>
												<p className="text-xs text-muted-foreground">
													Total kehadiran & alpa siswa
												</p>
											</CardContent>
										</Card>
									</div>
								</TabsContent>
							);
						})}
					</Tabs>
				) : (
					/* Single kelas — kartu biasa */
					<div className="grid gap-4 md:grid-cols-3">
						<Card className={isLowBalance ? "border-red-200 bg-red-50/50" : ""}>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">
									Sisa Kuota Pertemuan
								</CardTitle>
								<CalendarClock
									className={`h-4 w-4 ${isLowBalance ? "text-red-500" : "text-muted-foreground"}`}
								/>
							</CardHeader>
							<CardContent>
								<div
									className={`text-2xl font-bold ${isLowBalance ? "text-red-600" : ""}`}
								>
									{saldoList[0]?.sisaPertemuan ?? 0} Sesi
								</div>
								<p className="text-xs text-muted-foreground">
									{isLowBalance
										? "Kuota menipis, segera buat tagihan."
										: "Kuota pertemuan masih aman."}
								</p>
							</CardContent>
						</Card>
						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">
									Tagihan Berikutnya
								</CardTitle>
								<Banknote className="h-4 w-4 text-muted-foreground" />
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold">
									Ke-{saldoList[0]?.nextBillPembayaranKe ?? 1}
								</div>
								<p className="text-xs text-muted-foreground">
									Estimasi tagihan selanjutnya
								</p>
							</CardContent>
						</Card>
						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">
									Total Sesi Terpakai
								</CardTitle>
								<User className="h-4 w-4 text-muted-foreground" />
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold">
									{saldoList[0]?.totalTerpakai ?? 0}
								</div>
								<p className="text-xs text-muted-foreground">
									Total kehadiran & alpa siswa
								</p>
							</CardContent>
						</Card>
					</div>
				))}

			{/* --- 4. TABS SECTION --- */}
			<Tabs defaultValue="spp" className="w-full">
				<TabsList>
					<TabsTrigger value="spp">SPP (Tuition)</TabsTrigger>
					<TabsTrigger value="lainnya">Tagihan Lain (Buku/Regis)</TabsTrigger>
				</TabsList>

				<TabsContent value="spp" className="space-y-4 pt-4">
					<div className="flex items-center justify-between">
						<div className="space-y-1">
							<h2 className="text-lg font-semibold tracking-tight">
								History SPP
							</h2>
							<p className="text-sm text-muted-foreground">
								Pembayaran bulanan / per paket sesi.
							</p>
						</div>
					</div>

					{/* Multi-kelas: tampilkan tabel per grup kelas */}
					{isMultiKelas && groupedSPP.length > 0 ? (
						<div className="space-y-6">
							{groupedSPP.map(([kode, rows]) => (
								<div key={kode}>
									<div className="mb-2 flex items-center gap-2">
										<BookOpen className="h-4 w-4 text-muted-foreground" />
										<span className="text-sm font-semibold">{kode}</span>
										<span className="text-xs text-muted-foreground">
											({rows.length} tagihan)
										</span>
									</div>
									<DataTable columns={columns} data={rows} />
								</div>
							))}
						</div>
					) : dataGetAllPaginated && dataGetAllPaginated.length > 0 ? (
						<DataTable
							columns={columns}
							data={dataGetAllPaginated}
							toolbar={(table) => {
								const selectedRows = table.getFilteredSelectedRowModel().rows;
								const hasSelected = selectedRows.length > 0;

								return hasSelected ? (
									<Button
										size="sm"
										variant="outline"
										onClick={async () => {
											try {
												const idToast = toast.loading(
													"Membuat Kuitansi Massal...",
												);
												// Hanya ambil yang sudah lunas
												const validRows = selectedRows
													.filter(
														(r) =>
															r.original.statusBayar === StatusPembayaran.LUNAS,
													)
													.map((r) => r.original);

												if (validRows.length === 0) {
													toast.dismiss(idToast);
													toast.error("Tidak ada tagihan LUNAS yang dipilih");
													return;
												}

												const receiptItems = validRows.map((item) => ({
													id: item.id,
													judul: `SPP Bulan Ke-${item.pembayaranKe}`,
													kodeKelas: item.pendaftaranKelas.Kelas.kodeKelas,
													kategori: "SPP",
													jumlah: item.jumlahBayar,
													tanggalBayar: item.tanggalBayar,
												}));

												const adminName =
													validRows[0]?.verifiedBy?.name ?? "Admin";
												const muridN =
													validRows[0]?.pendaftaranKelas.murid.namaLengkap ??
													"Murid";
												const cabangName =
													validRows[0]?.pendaftaranKelas.Kelas.cabang
														?.namaCabang ?? "Pusat";

												const doc = (
													<ReceiptPDF
														items={receiptItems}
														namaMurid={muridN}
														cabangName={cabangName}
														adminName={adminName}
													/>
												);

												const asPdf = pdf(doc);
												const blob = await asPdf.toBlob();
												const url = URL.createObjectURL(blob);
												const link = document.createElement("a");
												link.href = url;
												link.download = `Kuitansi_Gabungan_SPP_${muridN}.pdf`;
												link.click();
												URL.revokeObjectURL(url);

												toast.dismiss(idToast);
												toast.success("Kuitansi massal berhasil diunduh");
												table.toggleAllRowsSelected(false);
											} catch (err) {
												console.error(err);
												toast.error("Gagal membuat kuitansi");
											}
										}}
									>
										<Download className="mr-2 h-4 w-4" />
										Unduh {selectedRows.length} Terpilih
									</Button>
								) : null;
							}}
						/>
					) : (
						<div className="flex h-40 flex-col items-center justify-center gap-2 rounded-md border border-dashed text-muted-foreground">
							<CreditCard className="h-8 w-8 opacity-50" />
							<p>Belum ada riwayat pembayaran SPP.</p>
						</div>
					)}
					{/* Tutup kondisi multi-kelas */}
				</TabsContent>

				<TabsContent value="lainnya" className="space-y-4 pt-4">
					<div className="flex items-center justify-between">
						<div className="space-y-1">
							<h2 className="text-lg font-semibold tracking-tight">
								Tagihan Lainnya
							</h2>
							<p className="text-sm text-muted-foreground">
								Biaya pendaftaran, buku, dan lain-lain.
							</p>
						</div>
					</div>

					{dataTagihanLain && dataTagihanLain.length > 0 ? (
						<DataTable
							columns={columnsLain}
							data={dataTagihanLain}
							toolbar={(table) => {
								const selectedRows = table.getFilteredSelectedRowModel().rows;
								const hasSelected = selectedRows.length > 0;

								return hasSelected ? (
									<Button
										size="sm"
										variant="outline"
										onClick={async () => {
											try {
												const idToast = toast.loading(
													"Membuat Kuitansi Massal...",
												);
												// Hanya ambil yang sudah lunas
												const validRows = selectedRows
													.filter(
														(r) => r.original.status === StatusPembayaran.LUNAS,
													)
													.map((r) => r.original);

												if (validRows.length === 0) {
													toast.dismiss(idToast);
													toast.error("Tidak ada tagihan LUNAS yang dipilih");
													return;
												}

												const receiptItems = validRows.map((item) => ({
													id: item.id,
													judul: item.judul,
													kodeKelas: item.kelas?.kodeKelas ?? "-",
													kategori: item.kategori,
													jumlah: item.jumlah,
													tanggalBayar: item.tanggalBayar,
												}));

												const adminName =
													validRows[0]?.verifiedBy?.name ?? "Admin";
												const muridN =
													validRows[0]?.murid.namaLengkap ?? "Murid";
												const cabangName =
													validRows[0]?.murid.cabang?.namaCabang ?? "Pusat";

												const doc = (
													<ReceiptPDF
														items={receiptItems}
														namaMurid={muridN}
														cabangName={cabangName}
														adminName={adminName}
													/>
												);

												const asPdf = pdf(doc);
												const blob = await asPdf.toBlob();
												const url = URL.createObjectURL(blob);
												const link = document.createElement("a");
												link.href = url;
												link.download = `Kuitansi_Gabungan_Lainnya_${muridN}.pdf`;
												link.click();
												URL.revokeObjectURL(url);

												toast.dismiss(idToast);
												toast.success("Kuitansi massal berhasil diunduh");
												table.toggleAllRowsSelected(false);
											} catch (err) {
												console.error(err);
												toast.error("Gagal membuat kuitansi");
											}
										}}
									>
										<Download className="mr-2 h-4 w-4" />
										Unduh {selectedRows.length} Terpilih
									</Button>
								) : null;
							}}
						/>
					) : (
						<div className="flex h-40 flex-col items-center justify-center gap-2 rounded-md border border-dashed text-muted-foreground">
							<Banknote className="h-8 w-8 opacity-50" />
							<p>Belum ada tagihan lain.</p>
						</div>
					)}
				</TabsContent>
			</Tabs>

			{/* Drawers & Dialogs */}
			<EditPembayaran />
			<EditTagihanLain
				isOpen={editTagihanLainOpen}
				onOpenChange={setEditTagihanLainOpen}
				data={tagihanLainToEdit}
			/>

			{/* Delete Dialog SPP */}
			<DeleteConfirmationDialog
				isOpen={deleteDialogOpen}
				onOpenChange={setDeleteDialogOpen}
				title="Hapus Tagihan SPP"
				description={
					<>
						Apakah Anda yakin ingin menghapus tagihan SPP ini? Data ini tidak
						dapat dikembalikan.
					</>
				}
				onConfirm={handleConfirmDelete}
				isLoading={mutations.delete.isPending}
				confirmText="Hapus"
				cancelText="Batal"
			/>

			{/* Delete Dialog Tagihan Lain */}
			<DeleteConfirmationDialog
				isOpen={deleteTagihanLainOpen}
				onOpenChange={setDeleteTagihanLainOpen}
				title="Hapus Tagihan Lain"
				description={
					<>
						Apakah Anda yakin ingin menghapus tagihan{" "}
						<b>{tagihanLainToDelete?.judul}</b> senilai{" "}
						<b>{toRupiah(tagihanLainToDelete?.jumlah ?? 0)}</b>?
					</>
				}
				onConfirm={handleConfirmDeleteTagihanLain}
				isLoading={mutationsTagihanLain.delete.isPending}
				confirmText="Hapus Tagihan"
				cancelText="Batal"
			/>
		</div>
	);
}
