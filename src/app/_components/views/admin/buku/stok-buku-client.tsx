"use client";

import {
	AlertTriangle,
	BookOpen,
	CalendarIcon,
	Check,
	CheckCircle2,
	ChevronsUpDown,
	Clock,
	Loader2,
	Package,
	Pencil,
	Plus,
	Trash2,
	UserPlus,
	Users,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { DeleteConfirmationDialog } from "@/app/_components/shared/delete-confirmation-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
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
import { UserRole } from "@/server/auth/type";
import { useGlobalCabangStore } from "@/store/useGlobalCabangStore";
import { api, type RouterOutputs } from "@/trpc/react";

function formatDate(date: Date | string | null | undefined) {
	if (!date) return null;
	return new Date(date).toLocaleDateString("id-ID", {
		day: "numeric",
		month: "long",
		year: "numeric",
	});
}

type TypeStokBuku = RouterOutputs["stokBuku"]["getAllStokBuku"][number];

// Hitung ringkasan penerima per level stok
function hitungPenerima(stok: TypeStokBuku) {
	const total = stok.penerimaBukus.length;
	const diambil = stok.penerimaBukus.filter(
		(p) => p.status === "SUDAH_DIAMBIL",
	).length;
	const bisaDiambil = stok.penerimaBukus.filter(
		(p) => p.statusOrder === "BISA_DIAMBIL" && p.status !== "SUDAH_DIAMBIL",
	).length;
	const ready = stok.penerimaBukus.filter(
		(p) => p.statusOrder === "READY",
	).length;
	const diorder = stok.penerimaBukus.filter(
		(p) => p.statusOrder === "DIORDER",
	).length;
	return {
		total,
		diambil,
		bisaDiambil,
		ready,
		diorder,
		dibutuhkan: diorder + ready + bisaDiambil,
	};
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function StokBukuClient() {
	const utils = api.useUtils();
	const { data: session } = useSession();
	const { activeCabangId } = useGlobalCabangStore();
	const queryCabangId = activeCabangId === "ALL" ? undefined : activeCabangId;

	const isManager = session?.user?.role === UserRole.MANAGER;
	// Manager tidak boleh melihat stok buku gabungan semua cabang — wajib
	// pilih cabang spesifik dulu lewat cabang switcher.
	const isManagerViewingAllCabang = isManager && activeCabangId === "ALL";

	const { data: stokBukuList, isLoading } =
		api.stokBuku.getAllStokBuku.useQuery(
			{ cabangId: queryCabangId },
			{ enabled: !isManagerViewingAllCabang },
		);

	const { data: jenisKelasList } = api.stokBuku.getJenisKelasUntukStok.useQuery(
		{ cabangId: queryCabangId },
	);

	// Add stok dialog
	const [addOpen, setAddOpen] = useState(false);
	const [newJenisKelasId, setNewJenisKelasId] = useState("");
	const [newLevel, setNewLevel] = useState("");
	const [newJumlah, setNewJumlah] = useState("");

	const [editingStok, setEditingStok] = useState<{
		id: string;
		jumlah: number;
	} | null>(null);
	const [deleteTarget, setDeleteTarget] = useState<{
		id: string;
		nama: string;
	} | null>(null);
	const [siswaSheetId, setSiswaSheetId] = useState<string | null>(null);

	const createStok = api.stokBuku.createStokBuku.useMutation({
		onSuccess: async () => {
			toast.success("Stok buku ditambahkan");
			setAddOpen(false);
			setNewJenisKelasId("");
			setNewLevel("");
			setNewJumlah("");
			await utils.stokBuku.getAllStokBuku.invalidate();
		},
		onError: (err) => toast.error(err.message ?? "Gagal"),
	});

	const updateJumlah = api.stokBuku.updateJumlahStok.useMutation({
		onSuccess: async () => {
			toast.success("Jumlah stok diperbarui");
			setEditingStok(null);
			await utils.stokBuku.getAllStokBuku.invalidate();
		},
		onError: (err) => toast.error(err.message ?? "Gagal"),
	});

	const deleteStok = api.stokBuku.deleteStokBuku.useMutation({
		onSuccess: async () => {
			toast.success("Stok buku dihapus");
			setDeleteTarget(null);
			await utils.stokBuku.getAllStokBuku.invalidate();
		},
		onError: (err) => toast.error(err.message ?? "Gagal"),
	});

	// Kelompokkan stok per jenis buku
	const grupStok = useMemo(() => {
		const groups = new Map<
			string,
			{ key: string; nama: string; items: NonNullable<typeof stokBukuList> }
		>();
		for (const stok of stokBukuList ?? []) {
			const key = stok.jenisKelas.nama.trim().toLowerCase();
			if (!groups.has(key)) {
				groups.set(key, { key, nama: stok.jenisKelas.nama, items: [] });
			}
			groups.get(key)?.items.push(stok);
		}
		return Array.from(groups.values());
	}, [stokBukuList]);

	const ringkasan = useMemo(() => {
		let totalStok = 0;
		let totalDibutuhkan = 0;
		let levelKurang = 0;
		for (const stok of stokBukuList ?? []) {
			const d = hitungPenerima(stok);
			totalStok += stok.jumlahStok;
			totalDibutuhkan += d.dibutuhkan;
			if (d.dibutuhkan > stok.jumlahStok) levelKurang += 1;
		}
		return { totalStok, totalDibutuhkan, levelKurang };
	}, [stokBukuList]);

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
						Kelola stok buku per jenis kelas, level, dan siswa penerima.
					</p>
				</div>
				<Button onClick={() => setAddOpen(true)}>
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

			{/* Ringkasan */}
			{stokBukuList && stokBukuList.length > 0 && (
				<div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
					{[
						{
							label: "Total Stok",
							value: ringkasan.totalStok,
							sub: "buku tersedia",
							icon: Package,
							tone: "text-blue-600 bg-blue-100 dark:bg-blue-950/40",
						},
						{
							label: "Dibutuhkan",
							value: ringkasan.totalDibutuhkan,
							sub: "order + ready + siap ambil",
							icon: BookOpen,
							tone: "text-green-600 bg-green-100 dark:bg-green-950/40",
						},
						{
							label: "Perlu Restock",
							value: ringkasan.levelKurang,
							sub: "level stoknya kurang",
							icon: AlertTriangle,
							tone:
								ringkasan.levelKurang > 0
									? "text-destructive bg-destructive/10"
									: "text-muted-foreground bg-muted",
						},
					].map((item) => (
						<div
							key={item.label}
							className="bg-card flex items-center gap-3 rounded-xl border p-4 shadow-sm"
						>
							<div
								className={cn(
									"flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
									item.tone,
								)}
							>
								<item.icon className="h-5 w-5" />
							</div>
							<div className="min-w-0">
								<div className="text-2xl font-bold leading-none">
									{item.value}
								</div>
								<div className="text-muted-foreground mt-1 truncate text-xs">
									{item.label} · {item.sub}
								</div>
							</div>
						</div>
					))}
				</div>
			)}

			<div className="space-y-4">
				{grupStok.map((group) => {
					const stokGrup = group.items.reduce((n, i) => n + i.jumlahStok, 0);
					const levelKurang = group.items.filter((stok) => {
						const d = hitungPenerima(stok);
						return d.dibutuhkan > stok.jumlahStok;
					}).length;

					return (
						<div
							key={group.key}
							className="bg-card overflow-hidden rounded-xl border shadow-sm"
						>
							{/* Header jenis buku */}
							<div className="bg-muted/40 flex items-center gap-3 border-b px-4 py-3">
								<div className="bg-primary/10 text-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
									<BookOpen className="h-4 w-4" />
								</div>
								<div className="min-w-0 flex-1">
									<h3 className="truncate text-sm font-bold">{group.nama}</h3>
									<p className="text-muted-foreground text-xs">
										{group.items.length} level · {stokGrup} buku tersedia
									</p>
								</div>
								{levelKurang > 0 && (
									<Badge variant="destructive" className="gap-1 text-xs">
										<AlertTriangle className="h-3 w-3" />
										{levelKurang} perlu restock
									</Badge>
								)}
							</div>

							{/* Baris per level */}
							<div className="divide-y">
								{group.items
									.slice()
									.sort((a, b) => a.level - b.level)
									.map((stok) => {
										const d = hitungPenerima(stok);
										const kurang = d.dibutuhkan > stok.jumlahStok;
										const isEditing = editingStok?.id === stok.id;

										const chips = [
											{
												label: "Order",
												value: d.diorder,
												className: "bg-muted text-foreground",
											},
											{
												label: "Ready",
												value: d.ready,
												className:
													"bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
											},
											{
												label: "Siap diambil",
												value: d.bisaDiambil,
												className:
													"bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300",
											},
										];

										return (
											<div
												key={stok.id}
												className={cn(
													"flex flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:gap-4",
													kurang && "bg-destructive/5",
												)}
											>
												{/* Level */}
												<div className="flex items-center gap-2 md:w-28 md:shrink-0 md:flex-col md:items-start md:gap-0">
													<span className="text-sm font-semibold">
														Level {stok.level}
													</span>
													<span className="text-muted-foreground truncate text-xs">
														{stok.cabang.namaCabang}
													</span>
												</div>

												{/* Stok tersedia */}
												<div className="md:w-44 md:shrink-0">
													{isEditing ? (
														<div className="flex items-center gap-1.5">
															<Input
																type="number"
																min={0}
																value={editingStok.jumlah}
																onChange={(e) =>
																	setEditingStok({
																		id: stok.id,
																		jumlah: Number(e.target.value) || 0,
																	})
																}
																className="h-8 w-20 text-sm"
															/>
															<Button
																size="sm"
																className="h-8"
																onClick={() =>
																	updateJumlah.mutate({
																		stokBukuId: editingStok.id,
																		jumlahStok: editingStok.jumlah,
																	})
																}
																disabled={updateJumlah.isPending}
															>
																{updateJumlah.isPending ? (
																	<Loader2 className="h-3 w-3 animate-spin" />
																) : (
																	"Simpan"
																)}
															</Button>
														</div>
													) : (
														<button
															type="button"
															title="Klik untuk ubah jumlah stok"
															onClick={() =>
																setEditingStok({
																	id: stok.id,
																	jumlah: stok.jumlahStok,
																})
															}
															className="group flex items-baseline gap-1.5 text-left"
														>
															<span
																className={cn(
																	"text-xl font-bold leading-none",
																	kurang && "text-destructive",
																)}
															>
																{stok.jumlahStok}
															</span>
															<span className="text-muted-foreground text-xs">
																buku
															</span>
															<Pencil className="text-muted-foreground h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
														</button>
													)}
													{kurang && !isEditing && (
														<p className="text-destructive mt-1 flex items-center gap-1 text-xs">
															<AlertTriangle className="h-3 w-3 shrink-0" />
															Kurang {d.dibutuhkan - stok.jumlahStok} buku
														</p>
													)}
												</div>

												{/* Status penerima */}
												<div className="flex flex-1 flex-wrap items-center gap-1.5">
													{chips.map((c) => (
														<span
															key={c.label}
															className={cn(
																"inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
																c.className,
																c.value === 0 && "opacity-40",
															)}
														>
															{c.label}
															<span className="font-bold">{c.value}</span>
														</span>
													))}
													<span className="text-muted-foreground inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs">
														<Users className="h-3 w-3" />
														Diambil
														<span className="text-foreground font-bold">
															{d.diambil}/{d.total}
														</span>
													</span>
												</div>

												{/* Aksi */}
												<div className="flex items-center gap-2 md:shrink-0">
													<Button
														variant="outline"
														size="sm"
														className="flex-1 md:flex-none"
														onClick={() => setSiswaSheetId(stok.id)}
													>
														<UserPlus className="mr-2 h-3.5 w-3.5" />
														Kelola Siswa
													</Button>
													<Button
														variant="ghost"
														size="icon"
														className="text-destructive h-8 w-8 shrink-0"
														title="Hapus stok"
														onClick={() =>
															setDeleteTarget({
																id: stok.id,
																nama: `${stok.jenisKelas.nama} Lv.${stok.level}`,
															})
														}
													>
														<Trash2 className="h-3.5 w-3.5" />
													</Button>
												</div>
											</div>
										);
									})}
							</div>
						</div>
					);
				})}
			</div>

			{/* Dialog Tambah Stok */}
			<Dialog open={addOpen} onOpenChange={setAddOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Tambah Stok Buku</DialogTitle>
						<DialogDescription>
							Stok dibedakan per Jenis Kelas dan Level.
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4">
						<div className="space-y-1.5">
							<Label>Jenis Buku</Label>
							<Select
								value={newJenisKelasId}
								onValueChange={setNewJenisKelasId}
							>
								<SelectTrigger>
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
						<div className="space-y-1.5">
							<Label>Level Buku</Label>
							<Select value={newLevel} onValueChange={setNewLevel}>
								<SelectTrigger>
									<SelectValue placeholder="Pilih level..." />
								</SelectTrigger>
								<SelectContent>
									{Array.from({ length: 10 }, (_, i) => String(i + 1)).map(
										(l) => (
											<SelectItem key={l} value={l}>
												Level {l}
											</SelectItem>
										),
									)}
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-1.5">
							<Label>Jumlah Stok Awal</Label>
							<Input
								type="number"
								min={0}
								placeholder="0"
								value={newJumlah}
								onChange={(e) => setNewJumlah(e.target.value)}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setAddOpen(false)}
							disabled={createStok.isPending}
						>
							Batal
						</Button>
						<Button
							onClick={() => {
								if (!newJenisKelasId || !newLevel) {
									toast.error("Lengkapi semua field");
									return;
								}
								createStok.mutate({
									jenisKelasId: newJenisKelasId,
									level: Number(newLevel),
									jumlahStok: Number(newJumlah) || 0,
									cabangId: queryCabangId,
								});
							}}
							disabled={createStok.isPending}
						>
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
						Yakin hapus{" "}
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
				stokBukuId={siswaSheetId}
				stokLabel={(() => {
					const stok = stokBukuList?.find((s) => s.id === siswaSheetId);
					return stok ? `${stok.jenisKelas.nama} — Level ${stok.level}` : null;
				})()}
				open={!!siswaSheetId}
				onOpenChange={(open) => !open && setSiswaSheetId(null)}
				queryCabangId={queryCabangId}
			/>
		</div>
	);
}

// ─── Sheet: Kelola Siswa Penerima ─────────────────────────────────────────────

function PenerimaBukuSheet({
	stokBukuId,
	stokLabel,
	open,
	onOpenChange,
	queryCabangId,
}: {
	stokBukuId: string | null;
	stokLabel: string | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	queryCabangId: string | undefined;
}) {
	const utils = api.useUtils();

	const [selectedKelasId, setSelectedKelasId] = useState("");
	const [selectedMuridId, setSelectedMuridId] = useState("");
	const [searchSiswa, setSearchSiswa] = useState("");
	const [siswaPopoverOpen, setSiswaPopoverOpen] = useState(false);
	const [kelasPopoverOpen, setKelasPopoverOpen] = useState(false);
	const [searchKelas, setSearchKelas] = useState("");
	const [statusOrder, setStatusOrder] = useState<
		"DIORDER" | "READY" | "BISA_DIAMBIL"
	>("DIORDER");
	const [tanggalReady, setTanggalReady] = useState<Date | undefined>();
	const [tanggalOpen, setTanggalOpen] = useState(false);
	const [filterKelasId, setFilterKelasId] = useState<string | null>(null);

	// Daftar kelas aktif untuk filter
	const { data: kelasAktifList, isLoading: loadingKelasAktif } =
		api.kelas.getKelasAktif.useQuery(
			{ cabangId: queryCabangId },
			{ enabled: open },
		);

	const handleKelasChange = (id: string) => {
		setSelectedKelasId(id);
		setSelectedMuridId("");
	};

	// Queries
	const muridQuery = api.stokBuku.getMuridBelumTerdaftar.useQuery(
		{
			stokBukuId: stokBukuId as string,
			kelasId: selectedKelasId || undefined,
		},
		{
			enabled: !!stokBukuId && open,
		},
	);
	const muridList = muridQuery.data as
		| { id: string; namaLengkap: string; levelKelas?: number | null }[]
		| undefined;
	const loadingMurid = muridQuery.isLoading;

	const { data: penerimaList, isLoading: loadingPenerima } =
		api.stokBuku.getPenerimaByStokBuku.useQuery(
			{ stokBukuId: stokBukuId as string },
			{ enabled: !!stokBukuId && open },
		);

	const invalidateAll = async () => {
		await utils.stokBuku.getPenerimaByStokBuku.invalidate();
		await utils.stokBuku.getMuridBelumTerdaftar.invalidate();
		await utils.stokBuku.getAllStokBuku.invalidate();
	};

	// Daftar kelas yang sudah di-order, dihitung dari penerimaList
	const kelasPenerimaList = useMemo(() => {
		if (!penerimaList) return [];

		const map = new Map<
			string,
			{ id: string; kodeKelas: string; level: number | null; jumlah: number }
		>();

		for (const p of penerimaList) {
			const key = p.kelas?.id ?? "tanpa-kelas";
			const existing = map.get(key);
			if (existing) {
				existing.jumlah += 1;
			} else {
				map.set(key, {
					id: key,
					kodeKelas: p.kelas?.kodeKelas ?? "Tanpa Kelas",
					level: p.kelas?.level ?? null,
					jumlah: 1,
				});
			}
		}

		return Array.from(map.values()).sort((a, b) =>
			a.kodeKelas.localeCompare(b.kodeKelas),
		);
	}, [penerimaList]);

	// Daftar penerima yang ditampilkan, difilter berdasarkan kelas yang diklik
	const filteredPenerimaList = useMemo(() => {
		if (!penerimaList) return [];
		if (!filterKelasId) return penerimaList;
		return penerimaList.filter(
			(p) => (p.kelas?.id ?? "tanpa-kelas") === filterKelasId,
		);
	}, [penerimaList, filterKelasId]);

	const addPenerima = api.stokBuku.addPenerimaBuku.useMutation({
		onSuccess: async () => {
			toast.success("Siswa ditambahkan ke list order");
			setSelectedMuridId("");
			await invalidateAll();
		},
		onError: (err) => toast.error(err.message ?? "Gagal"),
	});

	const updateStatusOrder = api.stokBuku.updateStatusOrder.useMutation({
		onSuccess: invalidateAll,
		onError: (err) => toast.error(err.message ?? "Gagal"),
	});

	const updateStatusAmbil = api.stokBuku.updateStatusPenerima.useMutation({
		onSuccess: invalidateAll,
		onError: (err) => toast.error(err.message ?? "Gagal"),
	});

	const removePenerima = api.stokBuku.deletePenerimaBuku.useMutation({
		onSuccess: async () => {
			toast.success("Siswa dihapus dari list");
			await invalidateAll();
		},
		onError: (err) => toast.error(err.message ?? "Gagal"),
	});

	const handleClose = (open: boolean) => {
		if (!open) {
			setSelectedKelasId("");
			setSearchKelas("");
			setSelectedMuridId("");
			setSearchSiswa("");
			setStatusOrder("DIORDER");
			setTanggalReady(undefined);
			setFilterKelasId(null);
		}
		onOpenChange(open);
	};

	return (
		<Sheet open={open} onOpenChange={handleClose}>
			<SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
				<SheetHeader>
					<SheetTitle>
						Siswa Penerima Buku{stokLabel ? ` — ${stokLabel}` : ""}
					</SheetTitle>
					<SheetDescription>
						Cari dan pilih siswa untuk ditambahkan.
					</SheetDescription>
				</SheetHeader>

				<div className="space-y-5 p-4">
					{/* Form Tambah */}
					<div className="space-y-3 rounded-lg border p-4">
						<Label className="text-sm font-semibold">Tambah Siswa</Label>

						{/* Kelas — filter siswa berdasarkan kelas */}
						<div className="space-y-1.5">
							<Label className="text-xs text-muted-foreground">Kelas</Label>
							<Popover
								open={kelasPopoverOpen}
								onOpenChange={setKelasPopoverOpen}
							>
								<PopoverTrigger asChild>
									<Button
										variant="outline"
										role="combobox"
										aria-expanded={kelasPopoverOpen}
										disabled={loadingKelasAktif}
										className={cn(
											"h-9 w-full justify-between font-normal",
											!selectedKelasId && "text-muted-foreground",
										)}
									>
										<span className="truncate">
											{loadingKelasAktif
												? "Memuat..."
												: (kelasAktifList?.find((k) => k.id === selectedKelasId)
														?.kodeKelas ?? "Pilih kelas...")}
										</span>
										<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
									</Button>
								</PopoverTrigger>
								<PopoverContent className="w-full min-w-md p-0" align="start">
									<Command shouldFilter={false}>
										<CommandInput
											placeholder="Cari kelas..."
											value={searchKelas}
											onValueChange={setSearchKelas}
										/>
										<CommandList className="max-h-64 overflow-y-auto">
											<CommandEmpty>Kelas tidak ditemukan.</CommandEmpty>
											<CommandGroup>
												{kelasAktifList
													?.filter((k) =>
														k.kodeKelas
															.toLowerCase()
															.includes(searchKelas.toLowerCase()),
													)
													.map((k) => (
														<CommandItem
															key={k.id}
															value={k.id}
															onSelect={() => {
																handleKelasChange(k.id);
																setKelasPopoverOpen(false);
																setSearchKelas("");
															}}
														>
															<Check
																className={cn(
																	"mr-2 h-4 w-4",
																	selectedKelasId === k.id
																		? "opacity-100"
																		: "opacity-0",
																)}
															/>
															<span>{k.kodeKelas}</span>
															<span className="text-muted-foreground ml-1.5 text-xs">
																— Level {k.level}
															</span>
														</CommandItem>
													))}
											</CommandGroup>
										</CommandList>
									</Command>
								</PopoverContent>
							</Popover>
						</div>

						{/* Siswa — tampilkan Nama + Level Kelas, bisa dicari, difilter oleh kelas di atas */}
						<div className="space-y-1.5">
							<Label className="text-xs text-muted-foreground">Siswa</Label>
							<div className="flex gap-2">
								<Popover
									open={siswaPopoverOpen}
									onOpenChange={setSiswaPopoverOpen}
								>
									<PopoverTrigger asChild>
										<Button
											variant="outline"
											role="combobox"
											aria-expanded={siswaPopoverOpen}
											disabled={loadingMurid}
											className={cn(
												"h-9 flex-1 justify-between font-normal",
												!selectedMuridId && "text-muted-foreground",
											)}
										>
											<span className="truncate">
												{loadingMurid
													? "Memuat..."
													: (muridList?.find((m) => m.id === selectedMuridId)
															?.namaLengkap ?? "Pilih siswa...")}
											</span>
											<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
										</Button>
									</PopoverTrigger>
									<PopoverContent className="w-full min-w-md p-0" align="start">
										<Command shouldFilter={false}>
											<CommandInput
												placeholder="Cari nama siswa..."
												value={searchSiswa}
												onValueChange={setSearchSiswa}
											/>
											<CommandList className="max-h-64 overflow-y-auto">
												<CommandEmpty>
													Semua siswa sudah terdaftar / tidak ditemukan
												</CommandEmpty>
												<CommandGroup>
													{muridList
														?.filter((m) =>
															m.namaLengkap
																.toLowerCase()
																.includes(searchSiswa.toLowerCase()),
														)
														.map((m) => (
															<CommandItem
																key={m.id}
																value={m.id}
																onSelect={() => {
																	setSelectedMuridId(m.id);
																	setSiswaPopoverOpen(false);
																	setSearchSiswa("");
																}}
															>
																<Check
																	className={cn(
																		"mr-2 h-4 w-4",
																		selectedMuridId === m.id
																			? "opacity-100"
																			: "opacity-0",
																	)}
																/>
																<span>{m.namaLengkap}</span>
																{m.levelKelas != null && (
																	<span className="text-muted-foreground ml-1 text-xs">
																		— Level {m.levelKelas}
																	</span>
																)}
															</CommandItem>
														))}
												</CommandGroup>
											</CommandList>
										</Command>
									</PopoverContent>
								</Popover>
								<Button
									size="sm"
									className="h-9 shrink-0"
									onClick={() => {
										if (!stokBukuId || !selectedMuridId) {
											toast.error("Pilih siswa dulu");
											return;
										}
										addPenerima.mutate({
											stokBukuId,
											muridIds: [selectedMuridId],
											kelasId: selectedKelasId || undefined,
											statusOrder,
											tanggalReady:
												statusOrder !== "DIORDER" ? tanggalReady : undefined,
										});
									}}
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

						{/* 4. Status Order awal */}
						<div className="space-y-1.5">
							<Label className="text-xs text-muted-foreground">
								Status Awal
							</Label>
							<div className="flex gap-2">
								{(
									[
										{ value: "DIORDER", label: "Diorder" },
										{ value: "READY", label: "Ready" },
										{ value: "BISA_DIAMBIL", label: "Bisa Diambil" },
									] as const
								).map(({ value, label }) => (
									<button
										key={value}
										type="button"
										onClick={() => setStatusOrder(value)}
										className={cn(
											"rounded-full border px-3 py-1 text-xs font-medium transition-colors",
											statusOrder === value
												? value === "BISA_DIAMBIL"
													? "bg-green-600 text-white border-green-600"
													: value === "READY"
														? "bg-blue-600 text-white border-blue-600"
														: "bg-primary text-primary-foreground border-primary"
												: "bg-background text-muted-foreground hover:bg-muted",
										)}
									>
										{label}
									</button>
								))}
							</div>
						</div>

						{/* Tanggal Ready */}
						{statusOrder !== "DIORDER" && (
							<div className="space-y-1.5">
								<Label className="text-xs text-muted-foreground">
									Tanggal Ready
								</Label>
								<Popover open={tanggalOpen} onOpenChange={setTanggalOpen}>
									<PopoverTrigger asChild>
										<Button
											variant="outline"
											size="sm"
											className="w-full justify-start h-9 text-xs"
										>
											<CalendarIcon className="mr-2 h-3.5 w-3.5" />
											{tanggalReady
												? formatDate(tanggalReady)
												: "Pilih tanggal..."}
										</Button>
									</PopoverTrigger>
									<PopoverContent className="w-auto p-0" align="start">
										<Calendar
											mode="single"
											selected={tanggalReady}
											onSelect={(d) => {
												setTanggalReady(d);
												setTanggalOpen(false);
											}}
											initialFocus
										/>
									</PopoverContent>
								</Popover>
							</div>
						)}
					</div>

					<Separator />

					{/* Daftar Kelas Penerima */}
					<div className="space-y-2">
						<div className="flex items-center justify-between gap-2">
							<Label className="text-muted-foreground text-xs uppercase tracking-wider">
								Daftar Kelas Penerima ({kelasPenerimaList.length})
							</Label>
							{filterKelasId && (
								<button
									type="button"
									onClick={() => setFilterKelasId(null)}
									className="text-muted-foreground hover:text-foreground text-xs underline underline-offset-2"
								>
									Hapus filter
								</button>
							)}
						</div>

						{loadingPenerima && (
							<div className="flex flex-wrap gap-2">
								{Array.from({ length: 3 }, (_, i) => i).map((id) => (
									<Skeleton key={id} className="h-6 w-20 rounded-full" />
								))}
							</div>
						)}

						{!loadingPenerima && kelasPenerimaList.length === 0 && (
							<p className="text-muted-foreground py-2 text-center text-sm italic">
								Belum ada kelas terdaftar.
							</p>
						)}

						{!loadingPenerima && kelasPenerimaList.length > 0 && (
							<div className="flex flex-wrap gap-2">
								{kelasPenerimaList.map((k) => {
									const active = filterKelasId === k.id;
									return (
										<button
											key={k.id}
											type="button"
											onClick={() =>
												setFilterKelasId((prev) =>
													prev === k.id ? null : k.id,
												)
											}
										>
											<Badge
												variant={active ? "default" : "secondary"}
												className={cn(
													"gap-1 rounded-full px-3 py-1 text-xs font-normal transition-colors",
													active && "ring-2 ring-primary/40",
												)}
											>
												{k.kodeKelas}
												{k.level != null && (
													<span
														className={cn(
															active
																? "text-primary-foreground/80"
																: "text-muted-foreground",
														)}
													>
														· Level {k.level}
													</span>
												)}
												<span
													className={cn(
														active
															? "text-primary-foreground/80"
															: "text-muted-foreground",
													)}
												>
													({k.jumlah} siswa)
												</span>
											</Badge>
										</button>
									);
								})}
							</div>
						)}
					</div>

					<Separator />

					{/* Daftar Penerima */}
					<div className="space-y-2">
						<Label className="text-muted-foreground text-xs uppercase tracking-wider">
							{filterKelasId
								? `Daftar Penerima — ${
										kelasPenerimaList.find((k) => k.id === filterKelasId)
											?.kodeKelas ?? ""
									} (${filteredPenerimaList.length})`
								: `Daftar Penerima (${penerimaList?.length ?? 0})`}
						</Label>

						{loadingPenerima && (
							<div className="space-y-2">
								{Array.from({ length: 3 }, (_, i) => i).map((id) => (
									<Skeleton key={id} className="h-20 w-full rounded-md" />
								))}
							</div>
						)}

						{!loadingPenerima && filteredPenerimaList.length === 0 && (
							<p className="text-muted-foreground py-6 text-center text-sm italic">
								{filterKelasId
									? "Tidak ada siswa di kelas ini."
									: "Belum ada siswa terdaftar."}
							</p>
						)}

						<div className="space-y-2">
							{filteredPenerimaList.map((p) => {
								const bisaDiambil = p.statusOrder === "BISA_DIAMBIL";
								const sudahDiambil = p.status === "SUDAH_DIAMBIL";
								const guruNama = p.guruPenerima
									.map((gp) => gp.guru.name)
									.filter(Boolean)
									.join(", ");

								return (
									<div
										key={p.id}
										className={cn(
											"rounded-md border p-3 space-y-2",
											sudahDiambil &&
												"border-green-200 bg-green-50/50 dark:border-green-900/50 dark:bg-green-950/20",
										)}
									>
										<div className="flex items-start justify-between gap-2">
											<div className="min-w-0">
												<p className="truncate text-sm font-medium">
													{p.murid.namaLengkap}
												</p>
												<div className="text-muted-foreground flex flex-wrap items-center gap-x-2 text-xs">
													{guruNama && <span>{guruNama}</span>}
													{p.statusOrder === "DIORDER" && (
														<span>
															{p.stokBuku.jenisKelas.nama} · Level{" "}
															{p.stokBuku.level}
														</span>
													)}
												</div>
											</div>
											<Button
												variant="ghost"
												size="icon"
												className="text-destructive h-7 w-7 shrink-0"
												onClick={() =>
													removePenerima.mutate({ penerimaBukuId: p.id })
												}
												disabled={removePenerima.isPending}
											>
												<Trash2 className="h-3.5 w-3.5" />
											</Button>
										</div>

										<div className="flex items-center gap-2 flex-wrap">
											{(
												[
													{ value: "DIORDER", label: "Diorder" },
													{ value: "READY", label: "Ready" },
													{ value: "BISA_DIAMBIL", label: "Bisa Diambil" },
												] as const
											).map(({ value, label }) => (
												<button
													key={value}
													type="button"
													onClick={() =>
														updateStatusOrder.mutate({
															penerimaBukuId: p.id,
															statusOrder: value,
															tanggalReady:
																value === "DIORDER" ? null : new Date(),
														})
													}
													disabled={updateStatusOrder.isPending}
													className={cn(
														"rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
														p.statusOrder === value
															? value === "BISA_DIAMBIL"
																? "bg-green-600 text-white border-green-600"
																: value === "READY"
																	? "bg-blue-600 text-white border-blue-600"
																	: "bg-primary text-primary-foreground border-primary"
															: "bg-background text-muted-foreground hover:bg-muted",
													)}
												>
													{label}
												</button>
											))}

											{p.statusOrder !== "DIORDER" && p.tanggalReady && (
												<span className="text-xs text-muted-foreground">
													{formatDate(p.tanggalReady)}
												</span>
											)}

											{bisaDiambil && (
												<Button
													size="sm"
													variant={sudahDiambil ? "default" : "outline"}
													className={cn(
														"h-7 text-xs ml-auto",
														sudahDiambil && "bg-blue-600 hover:bg-blue-700",
													)}
													onClick={() =>
														updateStatusAmbil.mutate({
															penerimaBukuId: p.id,
															status: sudahDiambil
																? "BELUM_DIAMBIL"
																: "SUDAH_DIAMBIL",
														})
													}
													disabled={updateStatusAmbil.isPending}
												>
													{sudahDiambil ? (
														<>
															<CheckCircle2 className="mr-1 h-3 w-3" />
															Diambil
														</>
													) : (
														<>
															<Clock className="mr-1 h-3 w-3" />
															Belum Diambil
														</>
													)}
												</Button>
											)}
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
