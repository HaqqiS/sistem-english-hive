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

	// Group by kelas
	const grouped: Record<string, typeof penerimaList> = {};
	for (const p of penerimaList) {
		const key = p.kelas?.kodeKelas ?? "Tanpa Kelas";
		if (!grouped[key]) grouped[key] = [];
		grouped[key].push(p);
	}

	return (
		<div className="space-y-4">
			<div className="flex items-center gap-3">
				<div className="bg-primary/10 rounded-xl p-2.5">
					<Package className="text-primary h-5 w-5" />
				</div>
				<div>
					<h2 className="text-lg font-bold">Order Buku</h2>
					<p className="text-muted-foreground text-sm">
						{guruId
							? `Daftar buku untuk siswa di kelas ${guruName ?? "guru ini"}.`
							: "Daftar buku untuk siswa di kelas Anda."}
					</p>
				</div>
			</div>

			{Object.entries(grouped).map(([kodeKelas, items]) => {
				const readyCount = items.filter(
					(i) => i.statusOrder === "READY",
				).length;
				const diambilCount = items.filter(
					(i) => i.status === "SUDAH_DIAMBIL",
				).length;

				return (
					<Card key={kodeKelas}>
						<CardHeader className="pb-3">
							<div className="flex items-center gap-2 flex-wrap">
								<BookOpen className="text-primary h-4 w-4 shrink-0" />
								<CardTitle className="text-base">{kodeKelas}</CardTitle>
								<Badge variant="secondary" className="text-xs">
									{diambilCount}/{items.length} diambil
								</Badge>
								<Badge
									variant="outline"
									className={cn(
										"text-xs ml-auto",
										readyCount > 0 && "border-green-500 text-green-600",
									)}
								>
									{readyCount} ready
								</Badge>
							</div>
						</CardHeader>
						<CardContent className="space-y-2">
							{items.map((p) => {
								const isReady = p.statusOrder === "READY";
								const sudahDiambil = p.status === "SUDAH_DIAMBIL";

								return (
									<div
										key={p.id}
										className={cn(
											"rounded-md border p-3 space-y-1",
											sudahDiambil
												? "border-green-200 bg-green-50/50 dark:border-green-900/50 dark:bg-green-950/20"
												: !isReady
													? "bg-muted/30"
													: "",
										)}
									>
										<div className="flex items-center justify-between gap-2">
											<div className="min-w-0">
												<p className="truncate text-sm font-medium">
													{p.murid.namaLengkap}{" "}
													<span className="text-muted-foreground font-normal text-xs">
														· {p.stokBuku.jenisKelas.nama} · Level{" "}
														{p.stokBuku.level}
													</span>
												</p>
												{p.murid.kelasSekolah && (
													<p className="text-muted-foreground text-xs">
														{p.murid.kelasSekolah}
													</p>
												)}
											</div>

											<div className="flex shrink-0 items-center gap-2">
												{/* Badge status order */}
												<Badge
													variant={isReady ? "default" : "secondary"}
													className={cn("text-xs", isReady && "bg-green-600")}
												>
													{isReady ? "Ready" : "Diorder"}
												</Badge>

												{/* Tombol ubah status ambil — hanya kalau READY */}
												{isReady && (
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
																Belum
															</>
														)}
													</Button>
												)}
											</div>
										</div>

										{/* Tanggal ready & tanggal diambil */}
										{isReady && p.tanggalReady && (
											<p className="text-xs text-muted-foreground">
												Ready sejak: {formatDate(p.tanggalReady)}
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
						</CardContent>
					</Card>
				);
			})}
		</div>
	);
}
