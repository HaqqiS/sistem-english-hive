"use client";

import { BookOpen, CheckCircle2, Clock, Package } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";

function formatDate(date: Date | string | null | undefined) {
	if (!date) return null;
	return new Date(date).toLocaleDateString("id-ID", {
		day: "numeric",
		month: "long",
		year: "numeric",
	});
}

export function PengambilanBukuSection({
	guruId,
	guruName,
}: {
	/** Kalau diisi, sedang dalam Mode Guru Pengganti: tampilkan & ambilkan buku atas nama guru ini */
	guruId?: string;
	guruName?: string;
}) {
	const utils = api.useUtils();

	const { data: penerimaList, isLoading } =
		api.stokBuku.getPenerimaForGuru.useQuery({ guruId });

	const updateStatus = api.stokBuku.updateStatusPenerima.useMutation({
		onSuccess: async () => {
			await utils.stokBuku.getPenerimaForGuru.invalidate();
		},
		onError: (err) => toast.error(err.message ?? "Gagal"),
	});

	if (isLoading) {
		return (
			<div className="space-y-3">
				{Array.from({ length: 2 }, (_, i) => i).map((id) => (
					<Skeleton key={id} className="h-20 w-full rounded-lg" />
				))}
			</div>
		);
	}

	if (!penerimaList || penerimaList.length === 0) return null;

	const bisaDiambilCount = penerimaList.filter(
		(i) => i.statusOrder === "BISA_DIAMBIL",
	).length;
	const diambilCount = penerimaList.filter(
		(i) => i.status === "SUDAH_DIAMBIL",
	).length;

	// Kelompokkan daftar per kelas siswa (kodeKelas), lalu urutkan nama kelas A-Z.
	// Yang tidak punya kelas (null) dikumpulkan di grup "Tanpa Kelas" di akhir.
	const groupedMap = new Map<string, typeof penerimaList>();
	for (const p of penerimaList) {
		const kelasLabel = p.kelas?.kodeKelas ?? "Tanpa Kelas";
		const existing = groupedMap.get(kelasLabel);
		if (existing) {
			existing.push(p);
		} else {
			groupedMap.set(kelasLabel, [p]);
		}
	}
	const groupedByKelas = Array.from(groupedMap.entries()).sort(([a], [b]) => {
		if (a === "Tanpa Kelas") return 1;
		if (b === "Tanpa Kelas") return -1;
		return a.localeCompare(b);
	});

	return (
		<div className="space-y-4">
			<div className="flex items-center gap-3">
				<div className="bg-primary/10 rounded-xl p-2.5">
					<Package className="text-primary h-5 w-5" />
				</div>
				<div>
					<h2 className="text-lg font-bold">Order Buku</h2>
					<p className="text-muted-foreground text-sm">
						{guruId ? (
							`Daftar buku untuk siswa ${guruName ?? "guru ini"}.`
						) : (
							<p>
								-- Jika status Bisa Diambil, silakan tekan tombol "Ambil
								Sekarang" & ambilkan bukunya.
								<br />
								<br />
								-- Jika siswa tidak hadir, konfirmasi ke admin agar status
								diubah menjadi "Belum Diambil" dan buku dikembalikan ke tempat
								semula.
								<br />
								<br />
								-- Jika status "Ready" tetapi tidak bisa diubah, silakan hubungi
								admin karena kemungkinan pembayaran buku siswa belum lunas.
							</p>
						)}
					</p>
				</div>
			</div>

			<Card>
				<CardHeader className="pb-3">
					<div className="flex items-center gap-2 flex-wrap">
						<BookOpen className="text-primary h-4 w-4 shrink-0" />
						<CardTitle className="text-base">Daftar Buku</CardTitle>
						<Badge variant="secondary" className="text-xs">
							{diambilCount}/{penerimaList.length} diambil
						</Badge>
						<Badge
							variant="outline"
							className={cn(
								"text-xs ml-auto",
								bisaDiambilCount > 0 && "border-green-500 text-green-600",
							)}
						>
							{bisaDiambilCount} bisa diambil
						</Badge>
					</div>
				</CardHeader>
				<CardContent className="space-y-4">
					{groupedByKelas.map(([kelasLabel, items]) => (
						<div key={kelasLabel} className="space-y-2">
							<div className="flex items-center gap-2">
								<h3 className="text-sm font-semibold text-foreground">
									{kelasLabel}
								</h3>
								<span className="text-muted-foreground text-xs">
									({items.length} siswa)
								</span>
							</div>

							<div className="space-y-2">
								{items.map((p) => {
									const bisaDiambil = p.statusOrder === "BISA_DIAMBIL";
									const sudahDiambil = p.status === "SUDAH_DIAMBIL";

									return (
										<div
											key={p.id}
											className={cn(
												"rounded-md border p-3 space-y-1",
												sudahDiambil
													? "border-green-200 bg-green-50/50 dark:border-green-900/50 dark:bg-green-950/20"
													: !bisaDiambil
														? "bg-muted/30"
														: "",
											)}
										>
											<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
												<div className="min-w-0">
													<p className="text-sm font-medium break-words">
														{p.murid.namaLengkap}{" "}
														<span className="text-muted-foreground font-normal text-xs">
															· {p.stokBuku.jenisKelas.nama} · Level{" "}
															{p.stokBuku.level}
														</span>
													</p>
												</div>

												<div className="flex flex-wrap items-center gap-2 sm:shrink-0 sm:justify-end">
													{/* Badge status order */}
													<Badge
														variant={bisaDiambil ? "default" : "secondary"}
														className={cn(
															"text-xs",
															bisaDiambil && "bg-green-600",
															p.statusOrder === "READY" &&
																"bg-blue-600 text-white hover:bg-blue-600",
														)}
													>
														{p.statusOrder === "DIORDER"
															? "Diorder"
															: p.statusOrder === "READY"
																? "Ready"
																: "Bisa Diambil"}
													</Badge>

													{/* Tombol ubah status ambil — hanya kalau Bisa Diambil */}
													{bisaDiambil && (
														<Button
															size="sm"
															variant={sudahDiambil ? "default" : "outline"}
															className={cn(
																"h-7 text-xs",
																sudahDiambil && "bg-blue-600 hover:bg-blue-700",
															)}
															onClick={() => {
																if (sudahDiambil) {
																	toast.error(
																		"Status sudah 'Diambil' dan tidak bisa diubah sendiri. Hubungi admin jika ingin merubah status.",
																	);
																	return;
																}
																updateStatus.mutate({
																	penerimaBukuId: p.id,
																	status: "SUDAH_DIAMBIL",
																	onBehalfOfGuruId: guruId,
																});
															}}
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
																	Ambil Sekarang?
																</>
															)}
														</Button>
													)}
												</div>
											</div>

											{/* Tanggal ready & tanggal diambil */}
											{p.statusOrder !== "DIORDER" && p.tanggalReady && (
												<p className="text-xs text-muted-foreground">
													Update status sejak: {formatDate(p.tanggalReady)}
												</p>
											)}
											{sudahDiambil && p.tanggalAmbil && (
												<p className="text-xs text-green-700 dark:text-green-500">
													Diambil pada: {formatDate(p.tanggalAmbil)}
												</p>
											)}
										</div>
									);
								})}
							</div>
						</div>
					))}
				</CardContent>
			</Card>
		</div>
	);
}
