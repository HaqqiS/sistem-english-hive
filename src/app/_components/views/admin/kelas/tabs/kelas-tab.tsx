"use client";

import { type JenisKelasModel, TipeKelas } from "@prisma/client";
import {
	Album,
	AlertCircle,
	ArrowRight,
	CalendarClock,
	CalendarDays,
	Edit2,
	EllipsisVertical,
	FileSpreadsheet,
	Filter,
	GraduationCap,
	RefreshCw,
	Trash,
	TrendingUp,
	User,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { DeleteConfirmationDialog } from "@/app/_components/shared/delete-confirmation-dialog";
import { HeaderActionPortal } from "@/app/_components/shared/header-action-portal";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useJenisKelas } from "@/hooks/useJenisKelas";
import { useKelas } from "@/hooks/useKelas";
import { cn } from "@/lib/utils";
import { useGlobalCabangStore } from "@/store/useGlobalCabangStore";
import { useGuruKelasStore, useKelasStore } from "@/store/useKelasStore";
import type { TypeKelasWithSesiPertemuanCount } from "@/types/kelas.type";
import { formatToWITA } from "@/utils/dateUtils";
import { downloadExcel } from "@/utils/exportUtils";
import { toRupiah } from "@/utils/toRupiah";
import EditGuruKelas from "../drawers/edit-guru-kelas";
import EditKelas from "../drawers/edit-kelas";
import TambahProgramKelas from "../drawers/tambah-kelas";
import UpLevelKelas from "../drawers/up-level-kelas";

export default function KelasTab() {
	const { activeCabangId } = useGlobalCabangStore();
	// 1. State Lokal untuk Delete Dialog
	const [deleteKelasDialogOpen, setDeleteKelasDialogOpen] = useState(false);
	const [selectedKelasToDelete, setSelectedKelasToDelete] =
		useState<TypeKelasWithSesiPertemuanCount | null>(null);

	const [selectedTipeKelas, setSelectedTipeKelas] = useState<TipeKelas | "ALL">(
		"ALL",
	);
	const [selectedJenisKelas, setSelectedJenisKelas] = useState<string | "ALL">(
		"ALL",
	);
	const [selectedLevelKelas, setSelectedLevelKelas] = useState<number | "ALL">(
		"ALL",
	);

	// 2. Zustand Store Actions
	const { openDrawer: openKelasDrawer } = useKelasStore();
	const { openDrawer: openGuruKelasDrawer } = useGuruKelasStore();

	const { data: jenisKelasList } = useJenisKelas();

	const {
		dataKelasCount,
		isLoadingKelasCount,
		isErrorKelasCount,
		isRefetchingKelasCount,
		errorKelasCount,
		refetchKelasCount,
		fetchExportData,
		mutations: kelasMutations,
	} = useKelas({
		filterCabang: activeCabangId,
		tipeKelas: selectedTipeKelas,
		jenisKelas: selectedJenisKelas,
		levelKelas: selectedLevelKelas,
		enableQueryGetKelasCount: true,

		onSuccessDelete: () => {
			setDeleteKelasDialogOpen(false);
			setSelectedKelasToDelete(null);
		},
	});

	// 4. Handlers
	const handleEditClickKelas = (item: TypeKelasWithSesiPertemuanCount) => {
		// Perlu casting karena TypeKelasWithSesiPertemuanCount strukturnya mirip TypeKelas
		// tapi ada tambahan _count. Untuk form edit, data dasar sudah cukup.
		openKelasDrawer("edit", item);
	};

	const handleEditClickGuruKelas = (item: TypeKelasWithSesiPertemuanCount) => {
		const history = item.historyGuruKelases?.[0];
		if (history) {
			// @ts-expect-error: types compatible
			openGuruKelasDrawer("edit", history);
		} else {
			toast.error("Tidak ada data guru aktif untuk diedit.");
		}
	};

	const handleUpLevelClick = (item: TypeKelasWithSesiPertemuanCount) => {
		openKelasDrawer("upLevel", item);
	};

	const handleDeleteClick = (item: TypeKelasWithSesiPertemuanCount) => {
		setSelectedKelasToDelete(item);
		setDeleteKelasDialogOpen(true);
	};

	const handleConfirmDeleteKelas = async () => {
		if (!selectedKelasToDelete) return;
		await kelasMutations.delete.mutateAsync({ id: selectedKelasToDelete.id });
	};

	const handleExport = async () => {
		const toastId = toast.loading("Mengunduh data kelas...");
		try {
			const data = await fetchExportData();

			if (!data || data.length === 0) {
				toast.error("Tidak ada data kelas untuk diexport.", { id: toastId });
				return;
			}

			// Format Data untuk CSV
			const csvData = data.map((item) => {
				// Ambil nama guru (jika ada)
				const guru = item.historyGuruKelases[0]?.guru.name ?? "Belum Ada";

				// Gabungkan hari jadwal (misal: "SENIN, RABU")
				const jadwal =
					item.jadwalKelas.length > 0
						? item.jadwalKelas.map((j) => j.hari).join(", ")
						: "-";

				return {
					"Kode Kelas": item.kodeKelas,
					Cabang: item.cabang.namaCabang,
					Program: item.jenisKelasRel?.nama ?? "Unknown",
					Level: item.level,
					Tipe: item.jenisKelasRel?.tipe ?? "Unknown",
					Grup: item.grup ?? "-",
					Pengajar: guru,
					Jadwal: jadwal,
					"Jumlah Murid": item._count.pendaftaranKelases,
					"Sesi Berjalan": item._count.sesiPertemuanKelases,
					Deskripsi: item.deskripsi ?? "-",
					"Harga Kelas": item.hargaKelas, // Angka murni agar bisa diolah Excel
				};
			});

			const filename = `Laporan-Kelas-Operasional-${new Date().toISOString().split("T")[0]}`;
			downloadExcel(csvData, filename);

			toast.success("Export berhasil!", { id: toastId });
		} catch (e) {
			console.error(e);
			toast.error("Gagal mengexport data.", { id: toastId });
		}
	};

	if (isLoadingKelasCount) {
		return (
			<div className="space-y-4 pt-4">
				{Array.from({ length: 3 }, (_, i) => i).map((id) => (
					<Skeleton key={id} className="h-24 w-full rounded-lg" />
				))}
			</div>
		);
	}

	if (isErrorKelasCount) {
		return (
			<Card className="border-destructive bg-destructive/10 mt-4">
				<CardHeader className="flex flex-row items-center gap-3 space-y-0">
					<AlertCircle className="text-destructive h-6 w-6" />
					<CardTitle className="text-destructive">Gagal Memuat Data</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-destructive/80 text-sm">
						{errorKelasCount?.message ?? "Terjadi kesalahan tidak diketahui."}
					</p>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="space-y-4">
			<HeaderActionPortal>
				<Button variant="ghost" size="sm" onClick={handleExport}>
					<FileSpreadsheet className="mr-2 h-4 w-4" />
					Export Excel
				</Button>
			</HeaderActionPortal>

			<header className="flex w-full flex-col gap-4">
				<div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
					<div className="flex flex-1 items-center gap-3">
						<Button
							variant="ghost"
							size="icon"
							className="h-9 w-9 shrink-0"
							disabled={isLoadingKelasCount || isRefetchingKelasCount}
							onClick={() => refetchKelasCount()}
							title="Refresh Jadwal"
						>
							<RefreshCw
								className={cn(
									"h-4 w-4",
									(isLoadingKelasCount || isRefetchingKelasCount) &&
										"animate-spin",
								)}
							/>
						</Button>
						<div>
							<h1 className="text-xl">Daftar Kelas</h1>
							<p className="text-muted-foreground text-sm">
								{dataKelasCount?.length} kelas terdaftar
							</p>
						</div>
					</div>

					<TambahProgramKelas />
				</div>

				<div className="flex flex-wrap gap-2">
					<Select
						value={selectedTipeKelas}
						onValueChange={(v) => setSelectedTipeKelas(v as TipeKelas | "ALL")}
					>
						<SelectTrigger className="bg-background w-full sm:w-fit sm:min-w-[160px]">
							<div className="flex items-center gap-2">
								<Filter className="text-muted-foreground h-4 w-4" />
								<span className="font-medium">
									<SelectValue />
								</span>
							</div>
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="ALL">Semua Tipe Kelas</SelectItem>
							{Object.values(TipeKelas).map((tipe) => (
								<SelectItem key={tipe} value={tipe}>
									{tipe.charAt(0).toUpperCase() + tipe.slice(1).toLowerCase()}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<Select
						value={selectedJenisKelas}
						onValueChange={(v) => setSelectedJenisKelas(v)}
					>
						<SelectTrigger className="bg-background w-full sm:w-fit sm:min-w-[160px]">
							<div className="flex items-center gap-2">
								<Filter className="text-muted-foreground h-4 w-4" />
								<span className="font-medium">
									<SelectValue />
								</span>
							</div>
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="ALL">Semua Jenis Kelas</SelectItem>
							{jenisKelasList
								?.filter(
									(jenis, index, self) =>
										index === self.findIndex((t) => t.nama === jenis.nama),
								)
								.map((jenis: JenisKelasModel) => (
									<SelectItem key={jenis.nama} value={jenis.nama}>
										<div className="flex items-center gap-2">{jenis.nama}</div>
									</SelectItem>
								))}
						</SelectContent>
					</Select>
					<Select
						value={selectedLevelKelas.toString()}
						onValueChange={(v) =>
							setSelectedLevelKelas(v === "ALL" ? "ALL" : Number(v))
						}
					>
						<SelectTrigger className="bg-background w-full sm:w-fit sm:min-w-[160px]">
							<div className="flex items-center gap-2">
								<Filter className="text-muted-foreground h-4 w-4" />
								<span className="font-medium">
									<SelectValue placeholder="Semua Level" />
								</span>
							</div>
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="ALL">Semua Level Kelas</SelectItem>
							<SelectItem value="1">Level 1</SelectItem>
							<SelectItem value="2">Level 2</SelectItem>
							<SelectItem value="3">Level 3</SelectItem>
							<SelectItem value="4">Level 4</SelectItem>
						</SelectContent>
					</Select>
				</div>
			</header>

			<Accordion
				type="single"
				collapsible
				className="grid w-full grid-cols-1 items-start gap-4 md:grid-cols-2"
			>
				{dataKelasCount && dataKelasCount.length > 0 ? (
					dataKelasCount.map((kelas) => {
						const guruAktif =
							kelas.historyGuruKelases[0]?.guru.name ?? "Belum ada guru";
						const lastSession = kelas.sesiPertemuanKelases[0]?.tanggalWaktu;
						const jadwalHari =
							kelas.jadwalKelas.length > 0
								? kelas.jadwalKelas.map((j) => j.hari).join(", ")
								: "Jadwal belum diatur";

						return (
							<Card className="py-0" key={kelas.id}>
								<CardContent className="p-0">
									<AccordionItem value={kelas.id} className="border-none">
										<AccordionTrigger className="hover:bg-muted/30 items-center px-6 py-5 transition-colors hover:no-underline">
											<div className="flex w-full flex-col gap-4">
												{/* Header: Kode & Badge */}
												<div className="flex w-full flex-col justify-between gap-2 sm:flex-row sm:items-center">
													<div className="flex items-center gap-3">
														<span className="text-foreground text-lg font-bold tracking-tight">
															{kelas.kodeKelas}
														</span>
													</div>
													<div className="flex flex-wrap items-center justify-end gap-2">
														<Badge
															variant="secondary"
															className="flex gap-1.5 px-2.5 py-1"
														>
															<GraduationCap className="h-3.5 w-3.5" />
															<span>{kelas._count.pendaftaranKelases}</span>
														</Badge>
														<Badge
															variant="outline"
															className="border-primary/30 text-primary flex gap-1.5 px-2.5 py-1"
														>
															<CalendarClock className="h-3.5 w-3.5" />
															<span>{kelas._count.sesiPertemuanKelases}</span>
														</Badge>
													</div>
												</div>

												{/* Subheader: Metadata */}
												<div className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-2 text-xs">
													<div className="flex items-center gap-1.5">
														<User className="text-primary h-3.5 w-3.5" />
														<span className="font-medium">{guruAktif}</span>
													</div>
													<div className="flex items-center gap-1.5">
														<CalendarDays className="text-primary h-3.5 w-3.5" />
														<span>{jadwalHari}</span>
													</div>
													{kelas.deskripsi && (
														<div className="flex items-center gap-1.5">
															<Album className="text-primary h-3.5 w-3.5" />
															<span className="line-clamp-1 max-w-[200px]">
																{kelas.deskripsi}
															</span>
														</div>
													)}
												</div>
											</div>
										</AccordionTrigger>

										<AccordionContent className="bg-muted/5 border-t px-6 py-5 data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
											<div className="flex flex-col gap-6">
												{/* Info Grid */}
												<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
													<div className="flex flex-col gap-1 rounded-lg border p-3">
														<span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
															Harga Kelas
														</span>
														<div className="flex items-baseline gap-1">
															<span className="text-lg font-semibold">
																{toRupiah(kelas.hargaKelas)}
															</span>
															<span className="text-muted-foreground text-xs">
																/ sesi
															</span>
														</div>
													</div>

													<div className="flex flex-col gap-1 rounded-lg border p-3">
														<span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
															Sesi Terakhir
														</span>
														<div className="font-medium">
															{lastSession ? (
																formatToWITA(lastSession)
															) : (
																<span className="text-muted-foreground italic">
																	Belum ada sesi
																</span>
															)}
														</div>
													</div>
												</div>

												{/* Daftar Murid Aktif */}
												<div>
													<p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
														Murid Aktif ({kelas._count.pendaftaranKelases})
													</p>
													{kelas.pendaftaranKelases.length > 0 ? (
														<div className="flex flex-col">
															{kelas.pendaftaranKelases.map((p, index) => (
																<div key={p.id} className="flex flex-col">
																	<div className="flex items-center py-2">
																		<span className="text-muted-foreground min-w-[24px] text-sm">
																			{index + 1}.
																		</span>
																		<span className="text-sm">
																			{p.murid?.namaLengkap ?? "Unknown"}
																		</span>
																	</div>
																	{index <
																		kelas.pendaftaranKelases.length - 1 && (
																		<Separator />
																	)}
																</div>
															))}
														</div>
													) : (
														<p className="text-sm text-muted-foreground italic">
															Belum ada murid aktif.
														</p>
													)}
												</div>

												{/* Action Buttons Group */}
												<div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
													<Button
														asChild
														size="sm"
														variant="ghost"
														className="w-full justify-start sm:w-auto"
													>
														<Link href={`/admin/kelas/sesi/${kelas.id}`}>
															<CalendarClock className="mr-2 h-4 w-4" />
															Riwayat Absensi
														</Link>
													</Button>

													<div className="flex items-center gap-2">
														<Button
															asChild
															size="sm"
															className="w-full sm:w-auto"
														>
															<Link href={`/admin/kelas/detail/${kelas.id}`}>
																Detail Kelas
																<ArrowRight className="ml-2 h-4 w-4" />
															</Link>
														</Button>

														<DropdownMenu>
															<DropdownMenuTrigger asChild>
																<Button
																	variant="outline"
																	size="icon"
																	className="h-9 w-9 shrink-0"
																>
																	<EllipsisVertical className="h-4 w-4" />
																	<span className="sr-only">Menu</span>
																</Button>
															</DropdownMenuTrigger>
															<DropdownMenuContent align="end" className="w-48">
																<DropdownMenuItem
																	onClick={() => handleEditClickKelas(kelas)}
																>
																	<Edit2 className="mr-2 h-4 w-4" />
																	Edit Data Kelas
																</DropdownMenuItem>
																<DropdownMenuItem
																	onClick={() =>
																		handleEditClickGuruKelas(kelas)
																	}
																>
																	<User className="mr-2 h-4 w-4" />
																	Ganti Pengajar
																</DropdownMenuItem>
																<DropdownMenuSeparator />
																<DropdownMenuItem
																	onClick={() => handleUpLevelClick(kelas)}
																>
																	<TrendingUp className="mr-2 h-4 w-4" />
																	Naik Level (Up Level)
																</DropdownMenuItem>
																<DropdownMenuSeparator />
																<DropdownMenuItem
																	variant="destructive"
																	onClick={() => handleDeleteClick(kelas)}
																>
																	<Trash className="mr-2 h-4 w-4" />
																	Hapus Kelas
																</DropdownMenuItem>
															</DropdownMenuContent>
														</DropdownMenu>
													</div>
												</div>
											</div>
										</AccordionContent>
									</AccordionItem>
								</CardContent>
							</Card>
						);
					})
				) : (
					<p className="text-muted-foreground text-center">Belum ada kelas.</p>
				)}
			</Accordion>

			<EditKelas />
			<EditGuruKelas />
			<UpLevelKelas />
			<DeleteConfirmationDialog
				isOpen={deleteKelasDialogOpen}
				onOpenChange={setDeleteKelasDialogOpen}
				title="Hapus Kelas"
				description={
					<>
						Yakin ingin menghapus Kelas{" "}
						<span className="text-accent font-bold">
							{selectedKelasToDelete?.kodeKelas}
						</span>
						? Tindakan ini tidak dapat dibatalkan.
					</>
				}
				onConfirm={handleConfirmDeleteKelas}
				isLoading={kelasMutations.delete.isPending}
				confirmText="Hapus"
				cancelText="Batal"
			/>
		</div>
	);
}
