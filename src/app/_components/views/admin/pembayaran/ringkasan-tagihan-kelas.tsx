"use client";

import { KategoriTagihan, StatusPembayaran } from "@prisma/client";
import {
	AlertCircle,
	CalendarCheck2,
	CalendarClock,
	ChevronDown,
	Loader2,
	Pencil,
	Plus,
	ReceiptText,
	Trash2,
	Wallet,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
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
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { api } from "@/trpc/react";
import { formatDateToYYYYMMDD, formatDateWITA } from "@/utils/dateUtils";
import { toRupiah } from "@/utils/toRupiah";

interface RingkasanTagihanKelasProps {
	kelasId: string;
	highlightMurid?: string;
}

type Jenis = "SPP" | "BUKU" | "REGISTRASI";

const JENIS_CONFIG: Record<Jenis, { label: string; judulDefault: string }> = {
	SPP: { label: "SPP", judulDefault: "SPP" },
	BUKU: { label: "Buku", judulDefault: "Buku" },
	REGISTRASI: { label: "Registrasi", judulDefault: "Biaya Registrasi" },
};

type Item = {
	id: string; // real DB id (without prefix)
	jenis: Jenis;
	label: string;
	jumlah: number;
	tanggal: Date | string | null; // tanggalBayar (lunas) atau tanggalJatuhTempo (belum lunas, SPP saja)
	lunas: boolean;
};

export default function RingkasanTagihanKelas({
	kelasId,
	highlightMurid,
}: RingkasanTagihanKelasProps) {
	const utils = api.useUtils();
	const [expandedMuridId, setExpandedMuridId] = useState<string | null>(null);

	// --- Dialog state: Tambah Pembayaran ---
	const [addForMurid, setAddForMurid] = useState<{
		muridId: string;
		namaLengkap: string;
		pendaftaranKelasId: string | null;
	} | null>(null);
	const [addJumlah, setAddJumlah] = useState("");
	const [addTanggal, setAddTanggal] = useState(
		formatDateToYYYYMMDD(new Date()),
	);
	const [addJenis, setAddJenis] = useState<Jenis>("SPP");
	const [addJudul, setAddJudul] = useState("");

	// --- Dialog state: Edit Item ---
	const [editItem, setEditItem] = useState<Item | null>(null);
	const [editJumlah, setEditJumlah] = useState("");
	const [editTanggal, setEditTanggal] = useState("");

	// --- Dialog state: Hapus Item ---
	const [deleteItem, setDeleteItem] = useState<Item | null>(null);

	const { data, isLoading } = api.pembayaran.getRingkasanKelas.useQuery(
		{ kelasId },
		{ enabled: !!kelasId },
	);

	// Otomatis buka card siswa yang namanya cocok dengan pencarian, supaya
	// hasil pencarian langsung terlihat begitu kelasnya dibuka.
	useEffect(() => {
		const term = highlightMurid?.trim().toLowerCase();
		if (!term || !data) return;
		const matched = data.data.find((m) =>
			m.namaLengkap.toLowerCase().includes(term),
		);
		if (matched) setExpandedMuridId(matched.muridId);
	}, [highlightMurid, data]);

	const invalidateAll = async () => {
		await utils.pembayaran.getRingkasanKelas.invalidate({ kelasId });
	};

	const createManualMutation = api.pembayaran.createManualTagihan.useMutation({
		onSuccess: async () => {
			toast.success("Pembayaran SPP berhasil ditambahkan");
			await invalidateAll();
			setAddForMurid(null);
			setAddJumlah("");
		},
		onError: (err) => toast.error(err.message),
	});

	const createTagihanMutation = api.tagihanLain.create.useMutation({
		onSuccess: async () => {
			toast.success("Tagihan berhasil ditambahkan");
			await invalidateAll();
			setAddForMurid(null);
			setAddJumlah("");
		},
		onError: (err) => toast.error(err.message),
	});

	const updateSppMutation = api.pembayaran.updatePembayaran.useMutation({
		onSuccess: async () => {
			toast.success("Pembayaran berhasil diperbarui");
			await invalidateAll();
			setEditItem(null);
		},
		onError: (err) => toast.error(err.message),
	});

	const deleteSppMutation = api.pembayaran.deletePembayaran.useMutation({
		onSuccess: async () => {
			toast.success("Pembayaran berhasil dihapus");
			await invalidateAll();
			setDeleteItem(null);
		},
		onError: (err) => toast.error(err.message),
	});

	const updateTagihanMutation = api.tagihanLain.update.useMutation({
		onSuccess: async () => {
			toast.success("Tagihan berhasil diperbarui");
			await invalidateAll();
			setEditItem(null);
		},
		onError: (err) => toast.error(err.message),
	});

	const deleteTagihanMutation = api.tagihanLain.delete.useMutation({
		onSuccess: async () => {
			toast.success("Tagihan berhasil dihapus");
			await invalidateAll();
			setDeleteItem(null);
		},
		onError: (err) => toast.error(err.message),
	});

	const isMutating =
		createManualMutation.isPending ||
		createTagihanMutation.isPending ||
		updateSppMutation.isPending ||
		deleteSppMutation.isPending ||
		updateTagihanMutation.isPending ||
		deleteTagihanMutation.isPending;

	const openEditDialog = (item: Item) => {
		setEditItem(item);
		setEditJumlah(String(item.jumlah));
		setEditTanggal(
			item.tanggal ? formatDateToYYYYMMDD(new Date(item.tanggal)) : "",
		);
	};

	const handleSubmitAdd = () => {
		const jumlah = Number(addJumlah);
		if (!jumlah || jumlah <= 0) {
			toast.error("Jumlah pembayaran tidak valid.");
			return;
		}
		if (!addForMurid) return;

		if (addJenis === "SPP") {
			if (!addForMurid.pendaftaranKelasId) {
				toast.error("Siswa ini belum memiliki pendaftaran kelas aktif.");
				return;
			}
			createManualMutation.mutate({
				pendaftaranKelasId: addForMurid.pendaftaranKelasId,
				jumlahBayar: jumlah,
				tanggalBayar: addTanggal,
			});
		} else {
			if (!addJudul.trim()) {
				toast.error("Judul tagihan harus diisi.");
				return;
			}
			createTagihanMutation.mutate({
				muridId: addForMurid.muridId,
				kelasId,
				kategori:
					addJenis === "BUKU"
						? KategoriTagihan.BUKU
						: KategoriTagihan.REGISTRASI,
				judul: addJudul.trim(),
				jumlah,
				status: StatusPembayaran.LUNAS,
			});
		}
	};

	const handleSubmitEdit = () => {
		if (!editItem) return;
		const jumlah = Number(editJumlah);
		if (!jumlah || jumlah <= 0) {
			toast.error("Jumlah tidak valid.");
			return;
		}

		if (editItem.jenis === "SPP") {
			updateSppMutation.mutate({
				id: editItem.id,
				jumlahBayar: jumlah,
				statusBayar: editItem.lunas
					? StatusPembayaran.LUNAS
					: StatusPembayaran.BELUM_LUNAS,
				tanggalBayar: editItem.lunas ? editTanggal : undefined,
				tanggalJatuhTempo: !editItem.lunas ? editTanggal : undefined,
			});
		} else {
			updateTagihanMutation.mutate({
				id: editItem.id,
				jumlah,
			});
		}
	};

	const handleConfirmDelete = () => {
		if (!deleteItem) return;
		if (deleteItem.jenis === "SPP") {
			deleteSppMutation.mutate({ id: deleteItem.id });
		} else {
			deleteTagihanMutation.mutate({ id: deleteItem.id });
		}
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-12">
				<Loader2 className="h-6 w-6 animate-spin" />
			</div>
		);
	}

	if (!data || data.data.length === 0) {
		return (
			<p className="text-muted-foreground py-8 text-center text-sm">
				Belum ada tagihan (SPP/Buku/Registrasi) untuk kelas ini.
			</p>
		);
	}

	return (
		<div className="space-y-2">
			{data.data.map((murid) => {
				const riwayatLunas: Item[] = [
					...murid.spp
						.filter((s) => s.statusBayar === StatusPembayaran.LUNAS)
						.map((s) => ({
							id: s.id,
							jenis: "SPP" as const,
							label: s.label,
							jumlah: s.jumlahBayar,
							tanggal: s.tanggalBayar,
							lunas: true,
						})),
					...murid.buku
						.filter((b) => b.status === StatusPembayaran.LUNAS)
						.map((b) => ({
							id: b.id,
							jenis: "BUKU" as const,
							label: b.label,
							jumlah: b.jumlah,
							tanggal: b.tanggalBayar,
							lunas: true,
						})),
					...murid.registrasi
						.filter((r) => r.status === StatusPembayaran.LUNAS)
						.map((r) => ({
							id: r.id,
							jenis: "REGISTRASI" as const,
							label: r.label,
							jumlah: r.jumlah,
							tanggal: r.tanggalBayar,
							lunas: true,
						})),
				].sort((a, b) => {
					const ta = a.tanggal ? new Date(a.tanggal).getTime() : 0;
					const tb = b.tanggal ? new Date(b.tanggal).getTime() : 0;
					return tb - ta;
				});

				const belumLunas: Item[] = [
					...murid.spp
						.filter((s) => s.statusBayar !== StatusPembayaran.LUNAS)
						.map((s) => ({
							id: s.id,
							jenis: "SPP" as const,
							label: s.label,
							jumlah: s.jumlahBayar,
							tanggal: s.tanggalJatuhTempo,
							lunas: false,
						})),
					...murid.buku
						.filter((b) => b.status !== StatusPembayaran.LUNAS)
						.map((b) => ({
							id: b.id,
							jenis: "BUKU" as const,
							label: b.label,
							jumlah: b.jumlah,
							tanggal: null,
							lunas: false,
						})),
					...murid.registrasi
						.filter((r) => r.status !== StatusPembayaran.LUNAS)
						.map((r) => ({
							id: r.id,
							jenis: "REGISTRASI" as const,
							label: r.label,
							jumlah: r.jumlah,
							tanggal: null,
							lunas: false,
						})),
				].sort((a, b) => {
					const ta = a.tanggal ? new Date(a.tanggal).getTime() : Infinity;
					const tb = b.tanggal ? new Date(b.tanggal).getTime() : Infinity;
					return ta - tb;
				});

				const totalBelumLunas = belumLunas.reduce(
					(sum, item) => sum + item.jumlah,
					0,
				);

				const isExpanded = expandedMuridId === murid.muridId;

				const renderItemRow = (item: Item) => (
					<li
						key={`${item.jenis}-${item.id}`}
						className="flex items-center justify-between gap-3 rounded-lg bg-background px-3 py-2 shadow-sm"
					>
						<div className="flex items-center gap-2.5">
							<div
								className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
									item.lunas
										? "bg-green-100 text-green-700"
										: "bg-red-100 text-red-600"
								}`}
							>
								{item.lunas ? (
									<ReceiptText className="h-4 w-4" />
								) : (
									<AlertCircle className="h-4 w-4" />
								)}
							</div>
							<div>
								<p className="text-sm font-medium leading-none">{item.label}</p>
								{item.tanggal && (
									<div className="mt-1 flex items-center gap-1 text-muted-foreground text-xs">
										{item.lunas ? (
											<CalendarCheck2 className="h-3 w-3" />
										) : (
											<CalendarClock className="h-3 w-3" />
										)}
										<span>
											{item.lunas ? "" : "Jatuh tempo "}
											{formatDateWITA(new Date(item.tanggal))}
										</span>
									</div>
								)}
							</div>
						</div>
						<div className="flex items-center gap-1">
							<span
								className={`text-sm font-semibold ${
									item.lunas ? "" : "text-red-600"
								}`}
							>
								{toRupiah(item.jumlah)}
							</span>
							<Button
								variant="ghost"
								size="icon"
								className="h-7 w-7 text-muted-foreground"
								onClick={() => openEditDialog(item)}
							>
								<Pencil className="h-3.5 w-3.5" />
							</Button>
							<Button
								variant="ghost"
								size="icon"
								className="h-7 w-7 text-red-500 hover:text-red-600"
								onClick={() => setDeleteItem(item)}
							>
								<Trash2 className="h-3.5 w-3.5" />
							</Button>
						</div>
					</li>
				);

				const isHighlighted =
					!!highlightMurid?.trim() &&
					murid.namaLengkap
						.toLowerCase()
						.includes(highlightMurid.trim().toLowerCase());

				return (
					<div
						key={murid.muridId}
						className={`overflow-hidden rounded-xl border bg-background ${
							isHighlighted ? "ring-2 ring-primary" : ""
						}`}
					>
						<button
							type="button"
							onClick={() =>
								setExpandedMuridId(isExpanded ? null : murid.muridId)
							}
							className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50"
						>
							<div className="flex items-center gap-3">
								<div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
									<Wallet className="h-4 w-4" />
								</div>
								<div>
									<p className="text-sm font-medium leading-none">
										{murid.namaLengkap}
									</p>
									<p className="mt-1 flex items-center gap-2 text-muted-foreground text-xs">
										<span>{riwayatLunas.length} lunas</span>
										{belumLunas.length > 0 && (
											<span className="text-red-500">
												· {belumLunas.length} belum lunas
											</span>
										)}
									</p>
								</div>
							</div>
							<div className="flex items-center gap-2">
								{belumLunas.length > 0 ? (
									<span className="text-sm font-semibold text-red-600">
										{toRupiah(totalBelumLunas)}
									</span>
								) : (
									<span className="text-sm font-semibold text-green-700">
										Lunas
									</span>
								)}
								<Button
									variant="ghost"
									size="icon"
									className="h-7 w-7 text-primary"
									onClick={(e) => {
										e.stopPropagation();
										setAddForMurid({
											muridId: murid.muridId,
											namaLengkap: murid.namaLengkap,
											pendaftaranKelasId: murid.pendaftaranKelasId,
										});
										setAddJumlah("");
										setAddTanggal(formatDateToYYYYMMDD(new Date()));
										setAddJenis("SPP");
										setAddJudul(JENIS_CONFIG.SPP.judulDefault);
									}}
								>
									<Plus className="h-4 w-4" />
								</Button>
								<ChevronDown
									className={`h-4 w-4 text-muted-foreground transition-transform ${
										isExpanded ? "rotate-180" : ""
									}`}
								/>
							</div>
						</button>

						{isExpanded && (
							<div className="space-y-4 border-t bg-muted/20 px-4 py-3">
								{/* Belum Lunas */}
								<div>
									<p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-red-600 uppercase tracking-wide">
										<AlertCircle className="h-3.5 w-3.5" />
										Belum Lunas
									</p>
									{belumLunas.length === 0 ? (
										<p className="text-muted-foreground text-sm">
											Semua tagihan sudah lunas.
										</p>
									) : (
										<ul className="space-y-2">
											{belumLunas.map(renderItemRow)}
										</ul>
									)}
								</div>

								{/* Riwayat Lunas */}
								<div>
									<p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-green-700 uppercase tracking-wide">
										<ReceiptText className="h-3.5 w-3.5" />
										Riwayat Lunas
									</p>
									{riwayatLunas.length === 0 ? (
										<p className="text-muted-foreground text-sm">
											Belum ada pembayaran yang dilunaskan di kelas ini.
										</p>
									) : (
										<ul className="space-y-2">
											{riwayatLunas.map(renderItemRow)}
										</ul>
									)}
								</div>
							</div>
						)}
					</div>
				);
			})}

			{/* Dialog: Tambah Pembayaran */}
			<Dialog
				open={!!addForMurid}
				onOpenChange={(open) => !open && setAddForMurid(null)}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Tambah Pembayaran</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						<p className="text-muted-foreground text-sm">
							Untuk{" "}
							<span className="font-medium text-foreground">
								{addForMurid?.namaLengkap}
							</span>
						</p>
						<div className="space-y-2">
							<Label htmlFor="add-jenis">Jenis Pembayaran</Label>
							<Select
								value={addJenis}
								onValueChange={(v) => {
									const jenis = v as Jenis;
									setAddJenis(jenis);
									setAddJudul(JENIS_CONFIG[jenis].judulDefault);
								}}
							>
								<SelectTrigger id="add-jenis" className="w-full">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="SPP">SPP</SelectItem>
									<SelectItem value="BUKU">Buku</SelectItem>
									<SelectItem value="REGISTRASI">Registrasi</SelectItem>
								</SelectContent>
							</Select>
						</div>
						{addJenis !== "SPP" && (
							<div className="space-y-2">
								<Label htmlFor="add-judul">Judul</Label>
								<Input
									id="add-judul"
									value={addJudul}
									onChange={(e) => setAddJudul(e.target.value)}
									placeholder={JENIS_CONFIG[addJenis].judulDefault}
								/>
							</div>
						)}
						<div className="space-y-2">
							<Label htmlFor="add-jumlah">Jumlah Bayar</Label>
							<Input
								id="add-jumlah"
								type="number"
								value={addJumlah}
								onChange={(e) => setAddJumlah(e.target.value)}
								placeholder="Contoh: 300000"
							/>
						</div>
						{addJenis === "SPP" && (
							<div className="space-y-2">
								<Label htmlFor="add-tanggal">Tanggal Bayar</Label>
								<Input
									id="add-tanggal"
									type="date"
									value={addTanggal}
									onChange={(e) => setAddTanggal(e.target.value)}
								/>
							</div>
						)}
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setAddForMurid(null)}>
							Batal
						</Button>
						<Button onClick={handleSubmitAdd} disabled={isMutating}>
							Simpan
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Dialog: Edit Item */}
			<Dialog
				open={!!editItem}
				onOpenChange={(open) => !open && setEditItem(null)}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Edit {editItem?.label}</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="edit-jumlah">Jumlah</Label>
							<Input
								id="edit-jumlah"
								type="number"
								value={editJumlah}
								onChange={(e) => setEditJumlah(e.target.value)}
							/>
						</div>
						{editItem?.jenis === "SPP" && (
							<div className="space-y-2">
								<Label htmlFor="edit-tanggal">
									{editItem.lunas
										? "Tanggal Dilunaskan"
										: "Tanggal Jatuh Tempo"}
								</Label>
								<Input
									id="edit-tanggal"
									type="date"
									value={editTanggal}
									onChange={(e) => setEditTanggal(e.target.value)}
								/>
							</div>
						)}
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setEditItem(null)}>
							Batal
						</Button>
						<Button onClick={handleSubmitEdit} disabled={isMutating}>
							Simpan Perubahan
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Alert Dialog: Hapus Item */}
			<AlertDialog
				open={!!deleteItem}
				onOpenChange={(open) => !open && setDeleteItem(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Hapus {deleteItem?.label}</AlertDialogTitle>
						<AlertDialogDescription>
							Data ini akan dihapus permanen dan tidak dapat dikembalikan.
							Lanjutkan?
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Batal</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleConfirmDelete}
							disabled={isMutating}
						>
							Ya, Hapus
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
