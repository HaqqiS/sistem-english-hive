"use client";

import { StatusPembayaran } from "@prisma/client";
import {
	CalendarClock,
	CheckCircle2,
	Loader2,
	MessageCircle,
	Search,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import SalinTeksButton from "@/app/_components/views/admin/pembayaran/salin-teks-button";
import TambahTagihanCepat from "@/app/_components/views/admin/pembayaran/tambah-tagihan-cepat";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { useGlobalCabangStore } from "@/store/useGlobalCabangStore";
import { api } from "@/trpc/react";
import { formatDateWITA } from "@/utils/dateUtils";
import {
	buildTeksReminderGabungan,
	formatWhatsAppReminderGabungan,
} from "@/utils/noWAUtils";
import { toRupiah } from "@/utils/toRupiah";

const JENIS_BADGE_CLASS: Record<string, string> = {
	SPP: "border-orange-300 text-orange-700",
	BUKU: "border-blue-300 text-blue-700",
	REGISTRASI: "border-purple-300 text-purple-700",
};

export default function KelasJatuhTempoH14() {
	const { activeCabangId } = useGlobalCabangStore();
	const utils = api.useUtils();

	const [searchKelas, setSearchKelas] = useState("");
	const [searchSiswa, setSearchSiswa] = useState("");
	const [muridToLunaskan, setMuridToLunaskan] = useState<string | null>(null);

	const { data, isLoading } = api.dashboard.getKelasJatuhTempoH14.useQuery({
		cabangId: activeCabangId,
	});

	const updateSppMutation = api.pembayaran.updatePembayaran.useMutation();
	const markAsPaidMutation = api.tagihanLain.markAsPaid.useMutation();

	const invalidateAll = async () => {
		await Promise.all([
			utils.dashboard.getKelasJatuhTempoH14.invalidate(),
			utils.pembayaran.getRingkasanKelas.invalidate(),
			utils.pembayaran.getRingkasanSemuaKelas.invalidate(),
			utils.pembayaran.getAllPaginated.invalidate(),
			utils.tagihanLain.getAllBukuPaginated.invalidate(),
			utils.tagihanLain.getAllRegistrasiPaginated.invalidate(),
		]);
	};

	const filteredData = useMemo(() => {
		if (!data) return [];
		return data
			.map((kelas) => {
				const matchKelas =
					searchKelas.trim() === "" ||
					kelas.kodeKelas.toLowerCase().includes(searchKelas.toLowerCase());
				if (!matchKelas) return null;

				const siswa = kelas.siswa.filter(
					(s) =>
						searchSiswa.trim() === "" ||
						s.namaLengkap.toLowerCase().includes(searchSiswa.toLowerCase()),
				);
				if (siswa.length === 0) return null;

				return { ...kelas, siswa };
			})
			.filter((k): k is NonNullable<typeof k> => k !== null);
	}, [data, searchKelas, searchSiswa]);

	const handleLunaskanSemua = async (
		semuaTagihan: {
			id: string;
			jenis: "SPP" | "BUKU" | "REGISTRASI";
			jumlah: number;
		}[],
	) => {
		const idToast = toast.loading("Melunaskan semua tagihan...");
		try {
			await Promise.all(
				semuaTagihan.map((item) =>
					item.jenis === "SPP"
						? updateSppMutation.mutateAsync({
								id: item.id,
								jumlahBayar: item.jumlah,
								statusBayar: StatusPembayaran.LUNAS,
								tanggalBayar: new Date().toISOString(),
							})
						: markAsPaidMutation.mutateAsync({ id: item.id }),
				),
			);
			await invalidateAll();
			toast.success("Semua tagihan berhasil dilunaskan", { id: idToast });
		} catch (error) {
			console.error(error);
			toast.error("Gagal melunaskan sebagian/semua tagihan", { id: idToast });
		} finally {
			setMuridToLunaskan(null);
		}
	};

	const isPending = updateSppMutation.isPending || markAsPaidMutation.isPending;

	return (
		<Card className="border-l-4 border-l-red-500">
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<CalendarClock className="h-5 w-5 text-red-500" />
					Kelas dengan Tagihan Jatuh Tempo (H-14)
				</CardTitle>
				<CardDescription>
					Siswa dengan tagihan SPP jatuh tempo dalam 14 hari ke depan (termasuk
					yang sudah lewat). Rincian & pengingat WA merangkum SEMUA tagihan
					siswa tsb (SPP + Buku + Registrasi) yang masih belum lunas — bisa
					langsung dilunaskan dari sini.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="flex flex-col gap-3 sm:flex-row">
					<div className="relative flex-1">
						<Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
						<Input
							placeholder="Cari kode kelas / jenis kelas..."
							className="pl-9"
							value={searchKelas}
							onChange={(e) => setSearchKelas(e.target.value)}
						/>
					</div>
					<div className="relative flex-1">
						<Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
						<Input
							placeholder="Cari nama siswa..."
							className="pl-9"
							value={searchSiswa}
							onChange={(e) => setSearchSiswa(e.target.value)}
						/>
					</div>
				</div>

				{isLoading ? (
					<div className="flex items-center justify-center py-8">
						<Loader2 className="h-5 w-5 animate-spin" />
					</div>
				) : filteredData.length === 0 ? (
					<p className="text-muted-foreground py-6 text-center text-sm">
						Tidak ada kelas dengan tagihan jatuh tempo dalam 14 hari ke depan.
					</p>
				) : (
					<div className="space-y-6">
						{filteredData.map((kelas) => (
							<div key={kelas.kelasId} className="space-y-2">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										<span className="font-semibold">{kelas.kodeKelas}</span>
										<Badge variant="secondary">
											{kelas.siswa.length} siswa
										</Badge>
									</div>
									<Button asChild variant="link" size="sm">
										<Link href={`/admin/pembayaran?kelasId=${kelas.kelasId}`}>
											Lihat Pembayaran Kelas
										</Link>
									</Button>
								</div>
								<div className="overflow-x-auto rounded-md border">
									<Table className="w-max min-w-full">
										<TableHeader>
											<TableRow>
												<TableHead>Nama Siswa</TableHead>
												<TableHead>Rincian Semua Tagihan</TableHead>
												<TableHead>Tenggat SPP</TableHead>
												<TableHead>Total Belum Lunas</TableHead>
												<TableHead className="text-right">Aksi</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{kelas.siswa.map((s) => {
												const isOverdue =
													new Date(s.tenggatTerdekat) < new Date();

												const waItems = s.semuaTagihan.map((item) => ({
													label: item.label,
													jumlah: item.jumlah,
												}));

												const reminderText =
													waItems.length > 0
														? buildTeksReminderGabungan(
																s.namaLengkap,
																kelas.kodeKelas,
																waItems,
															)
														: "";
												const waLink =
													waItems.length > 0
														? formatWhatsAppReminderGabungan(
																s.noWA,
																s.namaLengkap,
																kelas.kodeKelas,
																waItems,
															)
														: "#";

												return (
													<TableRow key={s.muridId}>
														<TableCell className="font-medium">
															{s.namaLengkap}
														</TableCell>
														<TableCell>
															<div className="flex flex-nowrap gap-1 whitespace-nowrap">
																{s.semuaTagihan.map((item) => (
																	<Badge
																		key={item.id}
																		variant="outline"
																		className={JENIS_BADGE_CLASS[item.jenis]}
																	>
																		{item.label}: {toRupiah(item.jumlah)}
																	</Badge>
																))}
															</div>
														</TableCell>
														<TableCell
															className={
																isOverdue
																	? "font-semibold text-red-600"
																	: "text-orange-600"
															}
														>
															{formatDateWITA(s.tenggatTerdekat)}
														</TableCell>
														<TableCell className="font-semibold">
															{toRupiah(s.totalBelumLunas)}
														</TableCell>
														<TableCell className="text-right">
															<div className="flex flex-nowrap items-center justify-end gap-2 whitespace-nowrap">
																<TambahTagihanCepat
																	muridId={s.muridId}
																	kelasId={kelas.kelasId}
																	namaLengkap={s.namaLengkap}
																	kategori="BUKU"
																	onSuccess={invalidateAll}
																/>
																<TambahTagihanCepat
																	muridId={s.muridId}
																	kelasId={kelas.kelasId}
																	namaLengkap={s.namaLengkap}
																	kategori="REGISTRASI"
																	onSuccess={invalidateAll}
																/>
																<Button
																	asChild
																	variant="outline"
																	size="sm"
																	disabled={waItems.length === 0}
																	className="gap-1 border-green-200 text-green-600 hover:bg-green-50"
																>
																	<Link href={waLink} target="_blank">
																		<MessageCircle className="h-4 w-4" />
																		<span className="hidden xl:inline">
																			Ingatkan
																		</span>
																	</Link>
																</Button>
																<SalinTeksButton
																	text={reminderText}
																	disabled={waItems.length === 0}
																/>

																<AlertDialog
																	open={muridToLunaskan === s.muridId}
																	onOpenChange={(open) =>
																		setMuridToLunaskan(open ? s.muridId : null)
																	}
																>
																	<Button
																		variant="default"
																		size="sm"
																		disabled={
																			s.totalBelumLunas === 0 || isPending
																		}
																		onClick={() =>
																			setMuridToLunaskan(s.muridId)
																		}
																		className="gap-1"
																	>
																		<CheckCircle2 className="h-4 w-4" />
																		<span className="hidden xl:inline">
																			Lunaskan Semua
																		</span>
																	</Button>
																	<AlertDialogContent>
																		<AlertDialogHeader>
																			<AlertDialogTitle>
																				Lunaskan Semua Tagihan
																			</AlertDialogTitle>
																			<AlertDialogDescription>
																				Semua tagihan SPP, Buku, dan Registrasi
																				milik {s.namaLengkap} di kelas{" "}
																				{kelas.kodeKelas} (total{" "}
																				{toRupiah(s.totalBelumLunas)}) akan
																				ditandai Lunas. Lanjutkan?
																			</AlertDialogDescription>
																		</AlertDialogHeader>
																		<AlertDialogFooter>
																			<AlertDialogCancel>
																				Batal
																			</AlertDialogCancel>
																			<AlertDialogAction
																				onClick={() =>
																					handleLunaskanSemua(s.semuaTagihan)
																				}
																			>
																				Ya, Lunaskan
																			</AlertDialogAction>
																		</AlertDialogFooter>
																	</AlertDialogContent>
																</AlertDialog>
															</div>
														</TableCell>
													</TableRow>
												);
											})}
										</TableBody>
									</Table>
								</div>
							</div>
						))}
					</div>
				)}
			</CardContent>
		</Card>
	);
}
