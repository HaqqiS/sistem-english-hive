"use client";

import { StatusPembayaran } from "@prisma/client";
import {
	Banknote,
	CalendarClock,
	CreditCard,
	Terminal,
	User,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useState } from "react";
import { DataTable } from "@/app/_components/shared/data-table-generic";
import { DeleteConfirmationDialog } from "@/app/_components/shared/delete-confirmation-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
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
import EditPembayaran from "../edit-pembayaran";
import EditTagihanLain from "../edit-tagihan-lain";

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

	// 3. Panggil Query Saldo (untuk Header & Cards)
	const { data: saldoInfo, isLoading: isLoadingSaldo } = getSaldoByMuridIdQuery(
		{ muridId: muridId },
		{ enabled: !!muridId },
	);

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

	const columns = createColumns({
		onDeleteClick: handleDeleteClick,
		onEditClick: handleEditClick,
		onVerifyClick: handleVerifyClick,
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

	const columnsLain = columnsTagihanLain({
		onDeleteClick: handleDeleteTagihanLain,
		onEditClick: handleEditTagihanLain,
		onVerifyClick: handleVerifyTagihanLain,
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
		saldoInfo?.muridName ??
		dataGetAllPaginated?.[0]?.pendaftaranKelas?.murid?.namaLengkap ??
		"Detail Murid";

	const kodeKelas =
		saldoInfo?.kodeKelas ??
		dataGetAllPaginated?.[0]?.pendaftaranKelas?.Kelas?.kodeKelas ??
		"-";

	const sisaKuota = saldoInfo?.sisaPertemuan ?? 0;
	const isLowBalance = sisaKuota <= 2;

	return (
		<div className="space-y-6 pb-10">
			{/* --- 1. HEADER SECTION --- */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex items-center gap-3">
					<div>
						<h1 className="flex items-center gap-2 text-xl font-bold tracking-tight">
							{namaMurid}
						</h1>
						<div className="flex items-center gap-2 text-sm text-muted-foreground">
							<Badge variant="outline" className="font-normal">
								{kodeKelas}
							</Badge>
							<span>•</span>
							<span>Riwayat Pembayaran</span>
						</div>
					</div>
				</div>
			</div>

			{/* --- 2. SUMMARY CARDS (SALDO INFO) --- */}
			<div className="grid gap-4 md:grid-cols-3">
				<Card className={isLowBalance ? "border-red-200 bg-red-50/50" : ""}>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Sisa Kuota Pertemuan
						</CardTitle>
						<CalendarClock
							className={`h-4 w-4 ${
								isLowBalance ? "text-red-500" : "text-muted-foreground"
							}`}
						/>
					</CardHeader>
					<CardContent>
						<div
							className={`text-2xl font-bold ${
								isLowBalance ? "text-red-600" : ""
							}`}
						>
							{saldoInfo?.sisaPertemuan ?? 0} Sesi
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
							Ke-{saldoInfo?.nextBillPembayaranKe ?? 1}
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
							{saldoInfo?.totalTerpakai ?? 0}
						</div>
						<p className="text-xs text-muted-foreground">
							Total kehadiran & alpa siswa
						</p>
					</CardContent>
				</Card>
			</div>

			{/* --- 3. TABS SECTION --- */}
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

					{dataGetAllPaginated && dataGetAllPaginated.length > 0 ? (
						<DataTable columns={columns} data={dataGetAllPaginated} />
					) : (
						<div className="flex h-40 flex-col items-center justify-center gap-2 rounded-md border border-dashed text-muted-foreground">
							<CreditCard className="h-8 w-8 opacity-50" />
							<p>Belum ada riwayat pembayaran SPP.</p>
						</div>
					)}
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
						<DataTable columns={columnsLain} data={dataTagihanLain} />
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
