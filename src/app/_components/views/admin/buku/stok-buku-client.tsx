"use client";

import {
	BookOpen,
	CalendarIcon,
	Check,
	CheckCircle2,
	ChevronsUpDown,
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
import { useGlobalCabangStore } from "@/store/useGlobalCabangStore";
import { api } from "@/trpc/react";

function formatDate(date: Date | string | null | undefined) {
	if (!date) return null;
	return new Date(date).toLocaleDateString("id-ID", {
		day: "numeric",
		month: "long",
		year: "numeric",
	});
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function StokBukuClient() {
	const utils = api.useUtils();
	const { activeCabangId } = useGlobalCabangStore();
	const queryCabangId = activeCabangId === "ALL" ? undefined : activeCabangId;

	const { data: stokBukuList, isLoading } =
		api.stokBuku.getAllStokBuku.useQuery({ cabangId: queryCabangId });

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

			<div className="space-y-6">
				{(() => {
					const palette = [
						"border-blue-200 bg-blue-50/60 dark:border-blue-900/40 dark:bg-blue-950/20",
						"border-green-200 bg-green-50/60 dark:border-green-900/40 dark:bg-green-950/20",
						"border-purple-200 bg-purple-50/60 dark:border-purple-900/40 dark:bg-purple-950/20",
						"border-amber-200 bg-amber-50/60 dark:border-amber-900/40 dark:bg-amber-950/20",
						"border-pink-200 bg-pink-50/60 dark:border-pink-900/40 dark:bg-pink-950/20",
						"border-cyan-200 bg-cyan-50/60 dark:border-cyan-900/40 dark:bg-cyan-950/20",
						"border-orange-200 bg-orange-50/60 dark:border-orange-900/40 dark:bg-orange-950/20",
						"border-teal-200 bg-teal-50/60 dark:border-teal-900/40 dark:bg-teal-950/20",
					];

					const groups = new Map<
						string,
						{ nama: string; items: NonNullable<typeof stokBukuList> }
					>();
					for (const stok of stokBukuList ?? []) {
						const key = stok.jenisKelas.id;
						if (!groups.has(key)) {
							groups.set(key, { nama: stok.jenisKelas.nama, items: [] });
						}
						groups.get(key)?.items.push(stok);
					}

					return Array.from(groups.entries()).map(([jenisKelasId], idx) => {
						const group = groups.get(jenisKelasId);
						if (!group) return null;
						const colorClass = palette[idx % palette.length];

						return (
							<div
								key={jenisKelasId}
								className={cn("space-y-3 rounded-xl border p-4", colorClass)}
							>
								<div className="flex items-center gap-2">
									<BookOpen className="text-primary h-4 w-4 shrink-0" />
									<h3 className="text-sm font-bold">{group.nama}</h3>
									<Badge variant="secondary" className="text-xs">
										{group.items.length} level
									</Badge>
								</div>

								<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
									{group.items.map((stok) => {
										const total = stok.penerimaBukus.length;
										const ready = stok.penerimaBukus.filter(
											(p) => p.statusOrder === "READY",
										).length;
										const diorder = stok.penerimaBukus.filter(
											(p) => p.statusOrder === "DIORDER",
										).length;
										const diambil = stok.penerimaBukus.filter(
											(p) =>
												p.statusOrder === "READY" &&
												p.status === "SUDAH_DIAMBIL",
										).length;
										const isEditing = editingStok?.id === stok.id;

										return (
											<Card key={stok.id} className="bg-background">
												<CardHeader className="pb-3">
													<div className="flex items-start justify-between gap-2">
														<div>
															<CardTitle className="text-base">
																Level {stok.level}
															</CardTitle>
															<CardDescription className="text-xs">
																{stok.cabang.namaCabang}
															</CardDescription>
														</div>
														<Button
															variant="ghost"
															size="icon"
															className="text-destructive h-7 w-7 shrink-0"
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
												</CardHeader>

												<CardContent className="space-y-3">
													{/* Jumlah Stok */}
													<div className="flex items-center justify-between rounded-md border p-3">
														<span className="text-muted-foreground text-xs font-medium">
															Stok Tersedia
														</span>
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
																	className="h-7 w-20 text-sm"
																/>
																<Button
																	size="sm"
																	className="h-7"
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
																onClick={() =>
																	setEditingStok({
																		id: stok.id,
																		jumlah: stok.jumlahStok,
																	})
																}
																className="text-sm font-bold hover:underline"
															>
																{stok.jumlahStok} buku
															</button>
														)}
													</div>

													{/* Ringkasan penerima */}
													<div className="grid grid-cols-2 gap-2 text-xs">
														<div className="bg-muted/50 flex items-center justify-between rounded-md border px-2.5 py-2">
															<span className="text-muted-foreground">
																Order
															</span>
															<span className="font-bold">{diorder}</span>
														</div>
														<div className="bg-muted/50 flex items-center justify-between rounded-md border px-2.5 py-2">
															<span className="text-muted-foreground">
																Ready
															</span>
															<span className="font-bold text-green-600">
																{ready}
															</span>
														</div>
														<div className="col-span-2 bg-muted/50 flex items-center justify-between rounded-md border px-2.5 py-2">
															<span className="text-muted-foreground flex items-center gap-1.5">
																<Users className="h-3.5 w-3.5" /> Diambil
															</span>
															<Badge variant="outline" className="text-xs">
																{diambil}/{total}
															</Badge>
														</div>
													</div>

													<Button
														variant="outline"
														size="sm"
														className="w-full"
														onClick={() => setSiswaSheetId(stok.id)}
													>
														<UserPlus className="mr-2 h-3.5 w-3.5" />
														Kelola Siswa Penerima
													</Button>
												</CardContent>
											</Card>
										);
									})}
								</div>
							</div>
						);
					});
				})()}
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
									{["1", "2", "3", "4"].map((l) => (
										<SelectItem key={l} value={l}>
											Level {l}
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

	const [selectedKelasId, setSelectedKelasId] = useState("");
	const [selectedMuridId, setSelectedMuridId] = useState("");
	const [searchSiswa, setSearchSiswa] = useState("");
	const [siswaPopoverOpen, setSiswaPopoverOpen] = useState(false);
	const [kelasPopoverOpen, setKelasPopoverOpen] = useState(false);
	const [searchKelas, setSearchKelas] = useState("");
	const [statusOrder, setStatusOrder] = useState<"DIORDER" | "READY">(
		"DIORDER",
	);
	const [tanggalReady, setTanggalReady] = useState<Date | undefined>();
	const [tanggalOpen, setTanggalOpen] = useState(false);

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
		}
		onOpenChange(open);
	};

	return (
		<Sheet open={open} onOpenChange={handleClose}>
			<SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
				<SheetHeader>
					<SheetTitle>Siswa Penerima Buku</SheetTitle>
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
												statusOrder === "READY" ? tanggalReady : undefined,
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
								{(["DIORDER", "READY"] as const).map((s) => (
									<button
										key={s}
										type="button"
										onClick={() => setStatusOrder(s)}
										className={cn(
											"rounded-full border px-3 py-1 text-xs font-medium transition-colors",
											statusOrder === s
												? s === "READY"
													? "bg-green-600 text-white border-green-600"
													: "bg-primary text-primary-foreground border-primary"
												: "bg-background text-muted-foreground hover:bg-muted",
										)}
									>
										{s}
									</button>
								))}
							</div>
						</div>

						{/* Tanggal Ready */}
						{statusOrder === "READY" && (
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

					{/* Daftar Penerima */}
					<div className="space-y-2">
						<Label className="text-muted-foreground text-xs uppercase tracking-wider">
							Daftar Penerima ({penerimaList?.length ?? 0})
						</Label>

						{loadingPenerima && (
							<div className="space-y-2">
								{Array.from({ length: 3 }, (_, i) => i).map((id) => (
									<Skeleton key={id} className="h-20 w-full rounded-md" />
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
								const isReady = p.statusOrder === "READY";
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
													{p.kelas && (
														<span>
															{p.kelas.kodeKelas} — Level {p.kelas.level}
														</span>
													)}
													{guruNama && <span>· {guruNama}</span>}
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
											<Button
												size="sm"
												variant={isReady ? "default" : "outline"}
												className={cn(
													"h-7 text-xs",
													isReady && "bg-green-600 hover:bg-green-700",
												)}
												onClick={() =>
													updateStatusOrder.mutate({
														penerimaBukuId: p.id,
														statusOrder: isReady ? "DIORDER" : "READY",
														tanggalReady: isReady ? null : new Date(),
													})
												}
												disabled={updateStatusOrder.isPending}
											>
												{isReady ? "✓ Ready" : "Set Ready"}
											</Button>

											{isReady && p.tanggalReady && (
												<span className="text-xs text-muted-foreground">
													{formatDate(p.tanggalReady)}
												</span>
											)}

											{isReady && (
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
