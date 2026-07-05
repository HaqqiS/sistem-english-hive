"use client";

import {
	BookOpen,
	CalendarIcon,
	CheckCircle2,
	Clock,
	Loader2,
	Package,
	Plus,
	Trash2,
	UserPlus,
	Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { DeleteConfirmationDialog } from "@/app/_components/shared/delete-confirmation-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useGlobalCabangStore } from "@/store/useGlobalCabangStore";
import { api } from "@/trpc/react";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(date: Date | string | null | undefined) {
	if (!date) return "-";
	return new Date(date).toLocaleDateString("id-ID", {
		day: "numeric",
		month: "long",
		year: "numeric",
	});
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function StokBukuClient() {
	const utils = api.useUtils();
	const { activeCabangId } = useGlobalCabangStore();
	const queryCabangId = activeCabangId === "ALL" ? undefined : activeCabangId;

	// Queries
	const { data: stokBukuList, isLoading } =
		api.stokBuku.getAllStokBuku.useQuery({ cabangId: queryCabangId });

	const { data: jenisKelasTanpaStok } =
		api.stokBuku.getJenisKelasTanpaStok.useQuery({ cabangId: queryCabangId });

	// Dialog states
	const [addStokOpen, setAddStokOpen] = useState(false);
	const [selectedJenisKelasId, setSelectedJenisKelasId] = useState("");
	const [jumlahStokInput, setJumlahStokInput] = useState("");
	const [editingStok, setEditingStok] = useState<{
		id: string;
		jumlahStok: number;
	} | null>(null);
	const [deleteTarget, setDeleteTarget] = useState<{
		id: string;
		nama: string;
	} | null>(null);
	const [siswaSheetStokId, setSiswaSheetStokId] = useState<string | null>(null);
	const [tanggalReadyOpen, setTanggalReadyOpen] = useState<string | null>(null);

	// Mutations
	const createStok = api.stokBuku.createStokBuku.useMutation({
		onSuccess: async () => {
			toast.success("Stok buku berhasil ditambahkan");
			setAddStokOpen(false);
			setSelectedJenisKelasId("");
			setJumlahStokInput("");
			await utils.stokBuku.getAllStokBuku.invalidate();
			await utils.stokBuku.getJenisKelasTanpaStok.invalidate();
		},
		onError: (err) => toast.error(err.message ?? "Gagal menambah stok"),
	});

	const updateStok = api.stokBuku.updateStokBuku.useMutation({
		onSuccess: async () => {
			toast.success("Stok buku berhasil diperbarui");
			setEditingStok(null);
			setTanggalReadyOpen(null);
			await utils.stokBuku.getAllStokBuku.invalidate();
		},
		onError: (err) => toast.error(err.message ?? "Gagal memperbarui stok"),
	});

	const deleteStok = api.stokBuku.deleteStokBuku.useMutation({
		onSuccess: async () => {
			toast.success("Stok buku berhasil dihapus");
			setDeleteTarget(null);
			await utils.stokBuku.getAllStokBuku.invalidate();
			await utils.stokBuku.getJenisKelasTanpaStok.invalidate();
		},
		onError: (err) => toast.error(err.message ?? "Gagal menghapus stok"),
	});

	// Handlers
	const handleCreateStok = () => {
		const jumlah = Number(jumlahStokInput);
		if (!selectedJenisKelasId) {
			toast.error("Pilih jenis buku");
			return;
		}
		if (Number.isNaN(jumlah) || jumlah < 0) {
			toast.error("Jumlah tidak valid");
			return;
		}
		createStok.mutate({
			jenisKelasId: selectedJenisKelasId,
			jumlahStok: jumlah,
			cabangId: queryCabangId,
		});
	};

	if (isLoading) {
		return (
			<div className="space-y-4">
				{Array.from({ length: 3 }, (_, i) => i).map((id) => (
					<Skeleton key={id} className="h-28 w-full rounded-lg" />
				))}
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h2 className="text-xl font-bold">Stok Buku</h2>
					<p className="text-muted-foreground text-sm">
						Kelola stok buku per jenis kelas dan siswa penerimanya.
					</p>
				</div>
				<Button onClick={() => setAddStokOpen(true)}>
					<Plus className="mr-2 h-4 w-4" />
					Tambah Stok Buku
				</Button>
			</div>

			{(!stokBukuList || stokBukuList.length === 0) && (
				<Card className="border-dashed">
					<CardContent className="text-muted-foreground flex flex-col items-center justify-center gap-2 py-12 text-center text-sm">
						<Package className="h-10 w-10 opacity-30" />
						<p>Belum ada stok buku.</p>
					</CardContent>
				</Card>
			)}

			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{stokBukuList?.map((stok) => {
					const totalPenerima = stok.penerimaBukus.length;
					const sudahDiambil = stok.penerimaBukus.filter(
						(p) => p.status === "SUDAH_DIAMBIL",
					).length;
					const isEditing = editingStok?.id === stok.id;
					const isReady = stok.statusStok === "READY";

					return (
						<Card
							key={stok.id}
							className={cn(
								"border-2",
								isReady ? "border-green-400/60" : "border-amber-400/60",
							)}
						>
							<CardHeader className="pb-3">
								<div className="flex items-start justify-between gap-2">
									<div className="flex items-center gap-2">
										<div
											className={cn(
												"rounded-lg p-2",
												isReady
													? "bg-green-100 dark:bg-green-950"
													: "bg-amber-100 dark:bg-amber-950",
											)}
										>
											<BookOpen
												className={cn(
													"h-4 w-4",
													isReady ? "text-green-600" : "text-amber-600",
												)}
											/>
										</div>
										<div>
											<CardTitle className="text-base">
												{stok.jenisKelas.nama}
											</CardTitle>
											<CardDescription className="text-xs">
												{stok.cabang.namaCabang}
											</CardDescription>
										</div>
									</div>
									<Button
										variant="ghost"
										size="icon"
										className="text-destructive h-7 w-7 shrink-0"
										onClick={() =>
											setDeleteTarget({
												id: stok.id,
												nama: stok.jenisKelas.nama,
											})
										}
									>
										<Trash2 className="h-3.5 w-3.5" />
									</Button>
								</div>
							</CardHeader>

							<CardContent className="space-y-3">
								{/* Status ORDER / READY */}
								<div className="flex items-center justify-between rounded-md border p-3">
									<span className="text-muted-foreground text-xs font-medium">
										Status
									</span>
									<div className="flex items-center gap-2">
										<Badge
											variant={isReady ? "default" : "secondary"}
											className={cn("text-xs", isReady && "bg-green-600")}
										>
											{isReady ? "READY" : "ORDER"}
										</Badge>
										<Button
											size="sm"
											variant="outline"
											className="h-6 text-xs px-2"
											disabled={updateStok.isPending}
											onClick={() =>
												updateStok.mutate({
													stokBukuId: stok.id,
													statusStok: isReady ? "ORDER" : "READY",
												})
											}
										>
											{isReady ? "Set ORDER" : "Set READY"}
										</Button>
									</div>
								</div>

								{/* Tanggal Ready */}
								<div className="flex items-center justify-between rounded-md border p-3">
									<span className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
										<CalendarIcon className="h-3.5 w-3.5" />
										Tanggal Ready
									</span>
									<Popover
										open={tanggalReadyOpen === stok.id}
										onOpenChange={(open) =>
											setTanggalReadyOpen(open ? stok.id : null)
										}
									>
										<PopoverTrigger asChild>
											<Button
												variant="ghost"
												size="sm"
												className="h-6 text-xs px-2"
											>
												{stok.tanggalReady
													? formatDate(stok.tanggalReady)
													: "Set tanggal"}
											</Button>
										</PopoverTrigger>
										<PopoverContent className="w-auto p-0" align="end">
											<Calendar
												mode="single"
												selected={
													stok.tanggalReady
														? new Date(stok.tanggalReady)
														: undefined
												}
												onSelect={(date) => {
													updateStok.mutate({
														stokBukuId: stok.id,
														tanggalReady: date ?? null,
													});
												}}
												initialFocus
											/>
										</PopoverContent>
									</Popover>
								</div>

								{/* Jumlah Stok */}
								<div className="flex items-center justify-between rounded-md border p-3">
									<span className="text-muted-foreground text-xs font-medium">
										Jumlah Stok
									</span>
									{isEditing ? (
										<div className="flex items-center gap-1.5">
											<Input
												type="number"
												min={0}
												value={editingStok.jumlahStok}
												onChange={(e) =>
													setEditingStok({
														id: stok.id,
														jumlahStok: Number(e.target.value) || 0,
													})
												}
												className="h-7 w-20 text-sm"
											/>
											<Button
												size="sm"
												className="h-7"
												onClick={() =>
													updateStok.mutate({
														stokBukuId: editingStok.id,
														jumlahStok: editingStok.jumlahStok,
													})
												}
												disabled={updateStok.isPending}
											>
												{updateStok.isPending ? (
													<Loader2 className="h-3 w-3 animate-spin" />
												) : (
													"Simpan"
												)}
											</Button>
										</div>
									) : (
										<button
											type="button"
											onClick={() =>
												setEditingStok({
													id: stok.id,
													jumlahStok: stok.jumlahStok,
												})
											}
											className="text-sm font-bold hover:underline"
										>
											{stok.jumlahStok} buku
										</button>
									)}
								</div>

								{/* Ringkasan Penerima */}
								<div className="flex items-center justify-between rounded-md border p-3 text-xs">
									<span className="text-muted-foreground flex items-center gap-1.5 font-medium">
										<Users className="h-3.5 w-3.5" />
										Penerima
									</span>
									<Badge variant="outline" className="text-xs">
										{sudahDiambil}/{totalPenerima} diambil
									</Badge>
								</div>

								<Button
									variant="outline"
									size="sm"
									className="w-full"
									onClick={() => setSiswaSheetStokId(stok.id)}
								>
									<UserPlus className="mr-2 h-3.5 w-3.5" />
									Kelola Siswa Penerima
								</Button>
							</CardContent>
						</Card>
					);
				})}
			</div>

			{/* Dialog Tambah Stok */}
			<Dialog open={addStokOpen} onOpenChange={setAddStokOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Tambah Stok Buku</DialogTitle>
						<DialogDescription>
							Nama buku diambil dari Jenis Kelas.
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4">
						<div className="space-y-1.5">
							<Label>Jenis Buku</Label>
							<Select
								value={selectedJenisKelasId}
								onValueChange={setSelectedJenisKelasId}
							>
								<SelectTrigger>
									<SelectValue placeholder="Pilih jenis kelas..." />
								</SelectTrigger>
								<SelectContent>
									{jenisKelasTanpaStok?.length === 0 && (
										<SelectItem value="_empty" disabled>
											Semua jenis kelas sudah punya stok
										</SelectItem>
									)}
									{jenisKelasTanpaStok?.map((j) => (
										<SelectItem key={j.id} value={j.id}>
											{j.nama}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-1.5">
							<Label>Jumlah Stok Awal</Label>
							<Input
								type="number"
								min={0}
								placeholder="0"
								value={jumlahStokInput}
								onChange={(e) => setJumlahStokInput(e.target.value)}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setAddStokOpen(false)}
							disabled={createStok.isPending}
						>
							Batal
						</Button>
						<Button onClick={handleCreateStok} disabled={createStok.isPending}>
							{createStok.isPending ? (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							) : (
								<Plus className="mr-2 h-4 w-4" />
							)}
							Tambah
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Dialog Delete */}
			<DeleteConfirmationDialog
				isOpen={!!deleteTarget}
				onOpenChange={(open) => !open && setDeleteTarget(null)}
				title="Hapus Stok Buku"
				description={
					<>
						Yakin hapus stok buku{" "}
						<span className="text-accent font-bold">{deleteTarget?.nama}</span>?
						Semua penerima terkait juga terhapus.
					</>
				}
				onConfirm={() => {
					if (deleteTarget) deleteStok.mutate({ stokBukuId: deleteTarget.id });
				}}
				isLoading={deleteStok.isPending}
				confirmText="Hapus"
				cancelText="Batal"
			/>

			{/* Sheet Kelola Siswa */}
			<PenerimaBukuSheet
				stokBukuId={siswaSheetStokId}
				open={!!siswaSheetStokId}
				onOpenChange={(open) => !open && setSiswaSheetStokId(null)}
				queryCabangId={queryCabangId}
			/>
		</div>
	);
}

// ─── Sheet: Kelola Siswa Penerima ────────────────────────────────────────────

function PenerimaBukuSheet({
	stokBukuId,
	open,
	onOpenChange,
	queryCabangId,
}: {
	stokBukuId: string | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	queryCabangId: string | undefined;
}) {
	const utils = api.useUtils();

	// Dropdown bertingkat: Jenis Kelas → Kelas → Siswa
	const [selectedJenisKelasId, setSelectedJenisKelasId] = useState("");
	const [selectedKelasId, setSelectedKelasId] = useState("");
	const [selectedMuridId, setSelectedMuridId] = useState("");

	// Query jenis kelas (semua, bukan yang belum punya stok — biar bisa pilih bebas)
	const { data: jenisKelasList } = api.jenisKelas.getJenisKelasList.useQuery(
		{ cabangId: queryCabangId },
		{ enabled: open },
	);

	// Query kelas berdasarkan jenis kelas yang dipilih
	const { data: kelasList, isLoading: loadingKelas } =
		api.stokBuku.getKelasByJenisKelas.useQuery(
			{ jenisKelasId: selectedJenisKelasId, cabangId: queryCabangId },
			{ enabled: !!selectedJenisKelasId && !!stokBukuId },
		);

	// Query murid yang belum terdaftar (difilter per kelas kalau ada)
	const { data: muridList, isLoading: loadingMurid } =
		api.stokBuku.getMuridBelumTerdaftar.useQuery(
			{
				stokBukuId: stokBukuId as string,
				kelasId: selectedKelasId || undefined,
				cabangId: queryCabangId,
			},
			{ enabled: !!stokBukuId },
		);

	// Query penerima yang sudah terdaftar
	const { data: penerimaList, isLoading: loadingPenerima } =
		api.stokBuku.getPenerimaByStokBuku.useQuery(
			{ stokBukuId: stokBukuId as string },
			{ enabled: !!stokBukuId },
		);

	const invalidateAll = async () => {
		await utils.stokBuku.getPenerimaByStokBuku.invalidate();
		await utils.stokBuku.getMuridBelumTerdaftar.invalidate();
		await utils.stokBuku.getAllStokBuku.invalidate();
	};

	const addPenerima = api.stokBuku.addPenerimaBuku.useMutation({
		onSuccess: async () => {
			toast.success("Siswa berhasil ditambahkan");
			setSelectedMuridId("");
			await invalidateAll();
		},
		onError: (err) => toast.error(err.message ?? "Gagal"),
	});

	const updateStatus = api.stokBuku.updateStatusPenerima.useMutation({
		onSuccess: invalidateAll,
		onError: (err) => toast.error(err.message ?? "Gagal"),
	});

	const removePenerima = api.stokBuku.deletePenerimaBuku.useMutation({
		onSuccess: async () => {
			toast.success("Siswa dihapus dari daftar");
			await invalidateAll();
		},
		onError: (err) => toast.error(err.message ?? "Gagal"),
	});

	const handleJenisKelasChange = (id: string) => {
		setSelectedJenisKelasId(id);
		setSelectedKelasId("");
		setSelectedMuridId("");
	};

	const handleKelasChange = (id: string) => {
		setSelectedKelasId(id);
		setSelectedMuridId("");
	};

	// Cari level dari kelas yang dipilih
	const selectedKelasData = kelasList?.find((k) => k.id === selectedKelasId);

	const handleAdd = () => {
		if (!stokBukuId || !selectedMuridId) {
			toast.error("Pilih siswa dulu");
			return;
		}
		addPenerima.mutate({
			stokBukuId,
			muridIds: [selectedMuridId],
			kelasId: selectedKelasId || undefined,
		});
	};

	// Reset saat sheet ditutup
	const handleOpenChange = (open: boolean) => {
		if (!open) {
			setSelectedJenisKelasId("");
			setSelectedKelasId("");
			setSelectedMuridId("");
		}
		onOpenChange(open);
	};

	return (
		<Sheet open={open} onOpenChange={handleOpenChange}>
			<SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
				<SheetHeader>
					<SheetTitle>Siswa Penerima Buku</SheetTitle>
					<SheetDescription>
						Pilih kelas terlebih dahulu, lalu tambahkan siswa penerima buku.
					</SheetDescription>
				</SheetHeader>

				<div className="space-y-5 p-4">
					{/* Dropdown bertingkat */}
					<div className="space-y-3 rounded-lg border p-4">
						<Label className="text-sm font-semibold">
							Tambah Siswa Penerima
						</Label>

						{/* 1. Pilih Jenis Kelas */}
						<div className="space-y-1.5">
							<Label className="text-xs text-muted-foreground">
								1. Jenis Kelas
							</Label>
							<Select
								value={selectedJenisKelasId}
								onValueChange={handleJenisKelasChange}
							>
								<SelectTrigger className="h-9">
									<SelectValue placeholder="Pilih jenis kelas..." />
								</SelectTrigger>
								<SelectContent>
									{jenisKelasList?.map((j) => (
										<SelectItem key={j.id} value={j.id}>
											{j.nama}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						{/* 2. Pilih Kelas */}
						<div className="space-y-1.5">
							<Label className="text-xs text-muted-foreground">
								2. Kelas & Level
							</Label>
							<Select
								value={selectedKelasId}
								onValueChange={handleKelasChange}
								disabled={!selectedJenisKelasId || loadingKelas}
							>
								<SelectTrigger className="h-9">
									<SelectValue
										placeholder={
											!selectedJenisKelasId
												? "Pilih jenis kelas dulu"
												: loadingKelas
													? "Memuat..."
													: "Pilih kelas..."
										}
									/>
								</SelectTrigger>
								<SelectContent>
									{kelasList?.length === 0 && (
										<SelectItem value="_empty" disabled>
											Tidak ada kelas aktif
										</SelectItem>
									)}
									{kelasList?.map((k) => (
										<SelectItem key={k.id} value={k.id}>
											{k.kodeKelas}
											<span className="text-muted-foreground ml-1.5 text-xs">
												— Level {k.level}
											</span>
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						{/* 3. Pilih Siswa */}
						<div className="space-y-1.5">
							<Label className="text-xs text-muted-foreground">3. Siswa</Label>
							<div className="flex gap-2">
								<Select
									value={selectedMuridId}
									onValueChange={setSelectedMuridId}
									disabled={loadingMurid}
								>
									<SelectTrigger className="h-9 flex-1">
										<SelectValue
											placeholder={
												loadingMurid ? "Memuat..." : "Pilih siswa..."
											}
										/>
									</SelectTrigger>
									<SelectContent>
										{muridList?.length === 0 && (
											<SelectItem value="_empty" disabled>
												Semua siswa sudah terdaftar
											</SelectItem>
										)}
										{muridList?.map((m) => (
											<SelectItem key={m.id} value={m.id}>
												{m.namaLengkap}
												{m.kelasSekolah ? (
													<span className="text-muted-foreground ml-1">
														— {m.kelasSekolah}
													</span>
												) : (
													""
												)}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<Button
									size="sm"
									className="h-9 shrink-0"
									onClick={handleAdd}
									disabled={addPenerima.isPending || !selectedMuridId}
								>
									{addPenerima.isPending ? (
										<Loader2 className="h-4 w-4 animate-spin" />
									) : (
										<Plus className="h-4 w-4" />
									)}
								</Button>
							</div>
						</div>

						{/* Info kelas terpilih */}
						{selectedKelasData && (
							<p className="text-xs text-muted-foreground">
								Level{" "}
								<span className="font-medium">{selectedKelasData.level}</span> ·{" "}
								{selectedKelasData.pendaftaranKelases.length} murid aktif
							</p>
						)}
					</div>

					<Separator />

					{/* Daftar Penerima */}
					<div className="space-y-2">
						<Label className="text-muted-foreground text-xs uppercase tracking-wider">
							Daftar Penerima ({penerimaList?.length ?? 0})
						</Label>

						{loadingPenerima && (
							<div className="space-y-2">
								{Array.from({ length: 3 }, (_, i) => i).map((id) => (
									<Skeleton key={id} className="h-16 w-full rounded-md" />
								))}
							</div>
						)}

						{!loadingPenerima && penerimaList?.length === 0 && (
							<p className="text-muted-foreground py-6 text-center text-sm italic">
								Belum ada siswa terdaftar.
							</p>
						)}

						<div className="space-y-2">
							{penerimaList?.map((p) => {
								const sudahDiambil = p.status === "SUDAH_DIAMBIL";
								return (
									<div key={p.id} className="rounded-md border p-3 space-y-1">
										<div className="flex items-center justify-between">
											<div className="min-w-0">
												<p className="truncate text-sm font-medium">
													{p.murid.namaLengkap}
												</p>
												<div className="flex items-center gap-2 text-xs text-muted-foreground">
													{p.kelas && (
														<span>
															{p.kelas.kodeKelas} — Level {p.kelas.level}
														</span>
													)}
													{p.murid.kelasSekolah && (
														<span>· {p.murid.kelasSekolah}</span>
													)}
												</div>
											</div>
											<div className="flex shrink-0 items-center gap-1.5">
												<Button
													size="sm"
													variant={sudahDiambil ? "default" : "outline"}
													className={cn(
														"h-7 text-xs",
														sudahDiambil && "bg-green-600 hover:bg-green-700",
													)}
													onClick={() =>
														updateStatus.mutate({
															penerimaBukuId: p.id,
															status: sudahDiambil
																? "BELUM_DIAMBIL"
																: "SUDAH_DIAMBIL",
														})
													}
													disabled={updateStatus.isPending}
												>
													{sudahDiambil ? (
														<>
															<CheckCircle2 className="mr-1 h-3 w-3" />
															Diambil
														</>
													) : (
														<>
															<Clock className="mr-1 h-3 w-3" />
															Belum
														</>
													)}
												</Button>
												<Button
													variant="ghost"
													size="icon"
													className="text-destructive h-7 w-7"
													onClick={() =>
														removePenerima.mutate({ penerimaBukuId: p.id })
													}
													disabled={removePenerima.isPending}
												>
													<Trash2 className="h-3.5 w-3.5" />
												</Button>
											</div>
										</div>
									</div>
								);
							})}
						</div>
					</div>
				</div>
			</SheetContent>
		</Sheet>
	);
}
