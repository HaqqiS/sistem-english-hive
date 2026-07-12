"use client";

import { StatusPembayaran } from "@prisma/client";
import { CheckCircle2, Loader2, MessageCircle } from "lucide-react";
import Link from "next/link";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { api } from "@/trpc/react";
import { formatDateWITA } from "@/utils/dateUtils";
import {
	buildTeksReminderGabungan,
	formatWhatsAppReminderGabungan,
	type WaTagihanItem,
} from "@/utils/noWAUtils";
import { toRupiah } from "@/utils/toRupiah";
import SalinTeksButton from "./salin-teks-button";
import StatusDiingatkanBadge from "./status-diingatkan-badge";
import TambahTagihanCepat from "./tambah-tagihan-cepat";

interface RingkasanTagihanKelasProps {
	kelasId: string;
}

export default function RingkasanTagihanKelas({
	kelasId,
}: RingkasanTagihanKelasProps) {
	const utils = api.useUtils();
	const [muridToLunaskan, setMuridToLunaskan] = useState<string | null>(null);

	const { data, isLoading } = api.pembayaran.getRingkasanKelas.useQuery(
		{ kelasId },
		{ enabled: !!kelasId },
	);

	const invalidateAll = async () => {
		await Promise.all([
			utils.pembayaran.getRingkasanKelas.invalidate({ kelasId }),
			utils.pembayaran.getRingkasanSemuaKelas.invalidate(),
			utils.pembayaran.getAllPaginated.invalidate(),
			utils.tagihanLain.getAllBukuPaginated.invalidate(),
			utils.tagihanLain.getAllRegistrasiPaginated.invalidate(),
		]);
	};

	const updateSppMutation = api.pembayaran.updatePembayaran.useMutation();
	const markAsPaidMutation = api.tagihanLain.markAsPaid.useMutation();

	const handleLunaskanSemua = async (muridId: string) => {
		const murid = data?.data.find((m) => m.muridId === muridId);
		if (!murid) return;

		const idToast = toast.loading("Melunaskan semua tagihan...");
		try {
			const sppBelumLunas = murid.spp.filter(
				(s) => s.statusBayar !== StatusPembayaran.LUNAS,
			);
			const bukuBelumLunas = murid.buku.filter(
				(b) => b.status !== StatusPembayaran.LUNAS,
			);
			const registrasiBelumLunas = murid.registrasi.filter(
				(r) => r.status !== StatusPembayaran.LUNAS,
			);

			await Promise.all([
				...sppBelumLunas.map((s) =>
					updateSppMutation.mutateAsync({
						id: s.id,
						jumlahBayar: s.jumlahBayar,
						statusBayar: StatusPembayaran.LUNAS,
						tanggalBayar: new Date().toISOString(),
					}),
				),
				...bukuBelumLunas.map((b) =>
					markAsPaidMutation.mutateAsync({ id: b.id }),
				),
				...registrasiBelumLunas.map((r) =>
					markAsPaidMutation.mutateAsync({ id: r.id }),
				),
			]);

			await invalidateAll();
			toast.success("Semua tagihan berhasil dilunaskan", { id: idToast });
		} catch (error) {
			console.error(error);
			toast.error("Gagal melunaskan sebagian/semua tagihan", { id: idToast });
		} finally {
			setMuridToLunaskan(null);
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
		<div className="overflow-x-auto rounded-md border">
			<Table className="w-max min-w-full">
				<TableHeader>
					<TableRow>
						<TableHead>Nama Siswa</TableHead>
						<TableHead>Rincian Tagihan</TableHead>
						<TableHead>Tenggat Terdekat</TableHead>
						<TableHead>Total Belum Lunas</TableHead>
						<TableHead className="text-right">Aksi</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{data.data.map((murid) => {
						const waItems: WaTagihanItem[] = [
							...murid.spp
								.filter((s) => s.statusBayar !== StatusPembayaran.LUNAS)
								.map((s) => ({
									label: s.label,
									jumlah: s.jumlahBayar,
									jatuhTempo: s.tanggalJatuhTempo,
								})),
							...murid.buku
								.filter((b) => b.status !== StatusPembayaran.LUNAS)
								.map((b) => ({ label: b.label, jumlah: b.jumlah })),
							...murid.registrasi
								.filter((r) => r.status !== StatusPembayaran.LUNAS)
								.map((r) => ({ label: r.label, jumlah: r.jumlah })),
						];

						const belumLunasBadges = [
							...murid.spp
								.filter((s) => s.statusBayar !== StatusPembayaran.LUNAS)
								.map((s) => (
									<StatusDiingatkanBadge
										key={`spp-${s.id}`}
										id={s.id}
										jenis="SPP"
										label={s.label}
										jumlah={s.jumlahBayar}
										sudahDiingatkan={s.sudahDiingatkan}
										onToggled={invalidateAll}
									/>
								)),
							...murid.buku
								.filter((b) => b.status !== StatusPembayaran.LUNAS)
								.map((b) => (
									<StatusDiingatkanBadge
										key={`buku-${b.id}`}
										id={b.id}
										jenis="BUKU"
										label={b.label}
										jumlah={b.jumlah}
										sudahDiingatkan={b.sudahDiingatkan}
										onToggled={invalidateAll}
									/>
								)),
							...murid.registrasi
								.filter((r) => r.status !== StatusPembayaran.LUNAS)
								.map((r) => (
									<StatusDiingatkanBadge
										key={`reg-${r.id}`}
										id={r.id}
										jenis="REGISTRASI"
										label={r.label}
										jumlah={r.jumlah}
										sudahDiingatkan={r.sudahDiingatkan}
										onToggled={invalidateAll}
									/>
								)),
						];

						const noWA = murid.noWA;
						const reminderText =
							waItems.length > 0
								? buildTeksReminderGabungan(
										murid.namaLengkap,
										data.kelas.kodeKelas,
										waItems,
										data.kelas.noRekening,
										data.kelas.bank,
										data.kelas.atasNama,
										murid.tenggatTerdekat,
									)
								: "";
						const waLink =
							waItems.length > 0
								? formatWhatsAppReminderGabungan(
										noWA,
										murid.namaLengkap,
										data.kelas.kodeKelas,
										waItems,
										data.kelas.noRekening,
										data.kelas.bank,
										data.kelas.atasNama,
										murid.tenggatTerdekat,
									)
								: "#";

						const isPending =
							updateSppMutation.isPending || markAsPaidMutation.isPending;

						return (
							<TableRow key={murid.muridId}>
								<TableCell className="font-medium">
									{murid.namaLengkap}
								</TableCell>
								<TableCell>
									{belumLunasBadges.length > 0 ? (
										<div className="flex flex-nowrap gap-1 whitespace-nowrap">
											{belumLunasBadges}
										</div>
									) : (
										<span className="text-muted-foreground text-xs">
											Semua Lunas
										</span>
									)}
								</TableCell>
								<TableCell>
									{murid.tenggatTerdekat ? (
										<Badge
											variant="outline"
											className={
												new Date(murid.tenggatTerdekat) < new Date()
													? "border-red-300 text-red-700"
													: "border-orange-300 text-orange-700"
											}
										>
											{formatDateWITA(murid.tenggatTerdekat)}
										</Badge>
									) : (
										<span className="text-muted-foreground text-xs">-</span>
									)}
								</TableCell>
								<TableCell className="font-semibold">
									{toRupiah(murid.totalBelumLunas)}
								</TableCell>
								<TableCell className="text-right">
									<div className="flex items-center justify-end gap-2">
										<TambahTagihanCepat
											muridId={murid.muridId}
											kelasId={kelasId}
											namaLengkap={murid.namaLengkap}
											kategori="BUKU"
											onSuccess={invalidateAll}
										/>
										<TambahTagihanCepat
											muridId={murid.muridId}
											kelasId={kelasId}
											namaLengkap={murid.namaLengkap}
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
												<span className="hidden xl:inline">Ingatkan</span>
											</Link>
										</Button>
										<SalinTeksButton
											text={reminderText}
											disabled={waItems.length === 0}
										/>

										<AlertDialog
											open={muridToLunaskan === murid.muridId}
											onOpenChange={(open) =>
												setMuridToLunaskan(open ? murid.muridId : null)
											}
										>
											<Button
												variant="default"
												size="sm"
												disabled={murid.totalBelumLunas === 0 || isPending}
												onClick={() => setMuridToLunaskan(murid.muridId)}
												className="gap-1"
											>
												<CheckCircle2 className="h-4 w-4" />
												<span className="hidden xl:inline">Lunaskan Semua</span>
											</Button>
											<AlertDialogContent>
												<AlertDialogHeader>
													<AlertDialogTitle>
														Lunaskan Semua Tagihan
													</AlertDialogTitle>
													<AlertDialogDescription>
														Semua tagihan SPP, Buku, dan Registrasi milik{" "}
														{murid.namaLengkap} di kelas ini (total{" "}
														{toRupiah(murid.totalBelumLunas)}) akan ditandai
														Lunas. Lanjutkan?
													</AlertDialogDescription>
												</AlertDialogHeader>
												<AlertDialogFooter>
													<AlertDialogCancel>Batal</AlertDialogCancel>
													<AlertDialogAction
														onClick={() => handleLunaskanSemua(murid.muridId)}
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
	);
}
