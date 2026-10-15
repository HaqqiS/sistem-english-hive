"use client";

import { KategoriTagihan, StatusPembayaran } from "@prisma/client";
import { Loader2, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
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
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";
import { formatDateToYYYYMMDD, formatDateWITA } from "@/utils/dateUtils";
import { toRupiah } from "@/utils/toRupiah";
import {
	type JenisRincian,
	PembayaranGridKelas,
} from "./pembayaran-grid-kelas";

interface RingkasanTagihanKelasProps {
	kelasId: string;
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
}: RingkasanTagihanKelasProps) {
	const utils = api.useUtils();
	// Rincian tagihan Buku/Registrasi satu siswa (dibuka dari sel tabel)
	const [rincian, setRincian] = useState<{
		muridId: string;
		jenis: JenisRincian;
	} | null>(null);

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
				Belum ada siswa di kelas ini.
			</p>
		);
	}

	// Rincian Buku/Registrasi siswa yang sedang dibuka (selalu dari data terbaru)
	const rincianMurid = rincian
		? data.data.find((m) => m.muridId === rincian.muridId)
		: undefined;
	const rincianItems =
		rincian && rincianMurid
			? (rincian.jenis === "BUKU"
					? rincianMurid.buku
					: rincianMurid.registrasi
				).map((t) => ({
					status: t.status,
					item: {
						id: t.id,
						jenis: rincian.jenis,
						label: t.label,
						jumlah: t.jumlah,
						tanggal:
							t.status === StatusPembayaran.LUNAS ? t.tanggalBayar : null,
						lunas: t.status === StatusPembayaran.LUNAS,
					} satisfies Item,
				}))
			: [];

	return (
		<div className="space-y-2">
			<PembayaranGridKelas
				data={data.data}
				onEditSpp={(spp) => {
					const lunas = spp.statusBayar === StatusPembayaran.LUNAS;
					openEditDialog({
						id: spp.id,
						jenis: "SPP",
						label: spp.label,
						jumlah: spp.jumlahBayar,
						tanggal: lunas ? spp.tanggalBayar : spp.tanggalJatuhTempo,
						lunas,
					});
				}}
				onTambah={(murid) => {
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
				onBukaRincian={(muridId, jenis) => setRincian({ muridId, jenis })}
			/>

			{/* Dialog: Rincian Buku / Registrasi */}
			<Dialog
				open={!!rincian}
				onOpenChange={(open) => !open && setRincian(null)}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							{rincian?.jenis === "BUKU"
								? "Tagihan Buku"
								: "Tagihan Registrasi"}
							{rincianMurid ? ` — ${rincianMurid.namaLengkap}` : ""}
						</DialogTitle>
					</DialogHeader>
					{rincianItems.length === 0 ? (
						<p className="text-muted-foreground text-sm">Belum ada tagihan.</p>
					) : (
						<ul className="space-y-2">
							{rincianItems.map(({ item, status }) => (
								<li
									key={item.id}
									className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2"
								>
									<div className="min-w-0">
										<p className="truncate text-sm font-medium">{item.label}</p>
										<p
											className={cn(
												"text-xs font-medium",
												status === StatusPembayaran.LUNAS && "text-green-700",
												status === StatusPembayaran.BELUM_LUNAS &&
													"text-red-600",
												status === StatusPembayaran.PENDING &&
													"text-orange-600",
											)}
										>
											{status === StatusPembayaran.LUNAS
												? "Lunas"
												: status === StatusPembayaran.PENDING
													? "Pending"
													: "Belum lunas"}
											{item.tanggal
												? ` · ${formatDateWITA(new Date(item.tanggal))}`
												: ""}
										</p>
									</div>
									<div className="flex shrink-0 items-center gap-1">
										<span className="text-sm font-semibold whitespace-nowrap">
											{toRupiah(item.jumlah)}
										</span>
										<Button
											variant="ghost"
											size="icon"
											className="text-muted-foreground h-7 w-7"
											onClick={() => {
												setRincian(null);
												openEditDialog(item);
											}}
										>
											<Pencil className="h-3.5 w-3.5" />
										</Button>
										<Button
											variant="ghost"
											size="icon"
											className="h-7 w-7 text-red-500 hover:text-red-600"
											onClick={() => {
												setRincian(null);
												setDeleteItem(item);
											}}
										>
											<Trash2 className="h-3.5 w-3.5" />
										</Button>
									</div>
								</li>
							))}
						</ul>
					)}
				</DialogContent>
			</Dialog>

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
						<Button
							variant="ghost"
							className="text-red-600 hover:text-red-700 sm:mr-auto"
							onClick={() => {
								if (editItem) setDeleteItem(editItem);
								setEditItem(null);
							}}
						>
							<Trash2 className="mr-1.5 h-4 w-4" />
							Hapus
						</Button>
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