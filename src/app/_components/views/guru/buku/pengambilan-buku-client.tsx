"use client";

import {
	BookOpen,
	CheckCircle2,
	ChevronDown,
	Clock,
	Package,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
	// Default tertutup supaya dashboard rapi; hanya notifikasi ringkas yang terlihat
	const [isOpen, setIsOpen] = useState(false);

	const { data: penerimaList, isLoading } =
		api.stokBuku.getPenerimaForGuru.useQuery({ guruId });

	const updateStatus = api.stokBuku.updateStatusPenerima.useMutation({
		onSuccess: async () => {
			await utils.stokBuku.getPenerimaForGuru.invalidate();
		},
		onError: (err) => toast.error(err.message ?? "Gagal"),
	});

	if (isLoading) {
		return <Skeleton className="h-20 w-full rounded-2xl" />;
	}

	if (!penerimaList || penerimaList.length === 0) return null;

	const diambilCount = penerimaList.filter(
		(i) => i.status === "SUDAH_DIAMBIL",
	).length;

	// Yang belum diambil, dirinci per status order (untuk notifikasi di header)
	const belumDiambil = penerimaList.filter((i) => i.status !== "SUDAH_DIAMBIL");
	const belumDiambilCount = belumDiambil.length;
	const bisaDiambilBelum = belumDiambil.filter(
		(i) => i.statusOrder === "BISA_DIAMBIL",
	).length;
	const readyBelum = belumDiambil.filter(
		(i) => i.statusOrder === "READY",
	).length;
	const diorderBelum = belumDiambil.filter(
		(i) => i.statusOrder === "DIORDER",
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
		<div
			className={cn(
				"bg-card overflow-hidden rounded-2xl border shadow-sm",
				bisaDiambilBelum > 0 && "border-green-300 dark:border-green-800",
			)}
		>
			{/* Header ringkas: selalu terlihat, ketuk untuk buka/tutup */}
			<button
				type="button"
				onClick={() => setIsOpen((v) => !v)}
				aria-expanded={isOpen}
				className="active:bg-muted/50 flex w-full items-center gap-3 p-4 text-left transition-colors"
			>
				<div className="shrink-0 rounded-xl bg-green-600/10 p-2.5">
					<Package className="h-5 w-5 text-green-600" />
				</div>

				<div className="min-w-0 flex-1">
					<p className="text-base leading-tight font-semibold">
						Pengambilan Buku
					</p>
					{guruId && (
						<p className="text-muted-foreground mt-0.5 truncate text-xs">
							Untuk siswa {guruName ?? "guru ini"}
						</p>
					)}
					<div className="mt-2 flex flex-wrap gap-1.5">
						{belumDiambilCount === 0 ? (
							<span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700 dark:bg-green-950/50 dark:text-green-300">
								<CheckCircle2 className="h-3 w-3" />
								Semua sudah diambil
							</span>
						) : (
							<>
								{bisaDiambilBelum > 0 && (
									<span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700 dark:bg-green-950/50 dark:text-green-300">
										{bisaDiambilBelum} bisa diambil
									</span>
								)}
								{readyBelum > 0 && (
									<span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
										{readyBelum} ready
									</span>
								)}
								{diorderBelum > 0 && (
									<span className="bg-muted text-muted-foreground rounded-full px-2.5 py-1 text-xs font-medium">
										{diorderBelum} diorder
									</span>
								)}
							</>
						)}
					</div>
				</div>

				{belumDiambilCount > 0 && (
					<span
						title={`${belumDiambilCount} buku belum diambil`}
						className="flex h-7 min-w-7 shrink-0 items-center justify-center rounded-full bg-red-500 px-2 text-sm leading-none font-bold text-white"
					>
						{belumDiambilCount}
					</span>
				)}
				<ChevronDown
					className={cn(
						"text-muted-foreground h-5 w-5 shrink-0 transition-transform",
						isOpen && "rotate-180",
					)}
				/>
			</button>

			{/* Isi: hanya tampil kalau dibuka */}
			{isOpen && (
				<div className="space-y-4 border-t p-4">
					<div className="bg-muted/40 text-muted-foreground rounded-lg p-3 text-xs">
						<p className="text-foreground mb-1.5 font-semibold">Panduan</p>
						<ol className="list-decimal space-y-1.5 pl-4">
							<li>
								Jika status Bisa Diambil, tekan tombol "Ambil Sekarang" &
								ambilkan bukunya.
							</li>
							<li>
								Jika siswa tidak hadir, konfirmasi ke admin agar status diubah
								menjadi "Belum Diambil" dan buku dikembalikan ke tempat semula.
							</li>
							<li>
								Jika status "Ready" tetapi tidak bisa diubah, hubungi admin
								karena kemungkinan pembayaran buku siswa belum lunas.
							</li>
						</ol>
					</div>

					<div className="flex items-center gap-2">
						<BookOpen className="text-primary h-4 w-4 shrink-0" />
						<h3 className="text-sm font-semibold">Daftar Buku</h3>
						<Badge variant="secondary" className="ml-auto text-xs">
							{diambilCount}/{penerimaList.length} diambil
						</Badge>
					</div>

					<div className="space-y-4">
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
																	sudahDiambil &&
																		"bg-blue-600 hover:bg-blue-700",
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
					</div>
				</div>
			)}
		</div>
	);
}
