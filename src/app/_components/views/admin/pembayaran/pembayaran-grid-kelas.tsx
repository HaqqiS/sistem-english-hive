"use client";

import type { StatusPembayaran, StatusPendaftaran } from "@prisma/client";
import { Check, Clock, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { labelUmurTahun } from "@/lib/hitung-umur";
import { cn } from "@/lib/utils";
import type { RouterOutputs } from "@/trpc/react";
import { formatDateWITA, formatToWITA } from "@/utils/dateUtils";
import { formatStatus } from "@/utils/statusUtils";
import { toRupiah } from "@/utils/toRupiah";

type RingkasanMurid =
	RouterOutputs["pembayaran"]["getRingkasanKelas"]["data"][number];
type PembayaranSpp = RingkasanMurid["spp"][number];

export type JenisRincian = "BUKU" | "REGISTRASI";

interface PembayaranGridKelasProps {
	data: RingkasanMurid[];
	/** Klik sel SPP: buka dialog edit pembayaran tersebut. */
	onEditSpp: (spp: PembayaranSpp) => void;
	/** Klik tombol +: tambah pembayaran untuk siswa. */
	onTambah: (murid: RingkasanMurid) => void;
	/** Klik sel Buku / Registrasi: buka rincian tagihan siswa tersebut. */
	onBukaRincian: (muridId: string, jenis: JenisRincian) => void;
}

/** Isi sel penuh seperti conditional formatting di Excel: hijau / merah / oranye. */
const ISI_STATUS: Record<StatusPembayaran, string> = {
	LUNAS: "bg-green-600 text-white hover:bg-green-700",
	BELUM_LUNAS: "bg-red-600 text-white hover:bg-red-700",
	PENDING: "bg-orange-500 text-white hover:bg-orange-600",
};

const LABEL_STATUS: Record<StatusPembayaran, string> = {
	LUNAS: "Lunas",
	BELUM_LUNAS: "Belum lunas",
	PENDING: "Pending",
};

function IkonStatus({
	status,
	className,
}: {
	status: StatusPembayaran;
	className?: string;
}) {
	// Ikon dipakai selain warna, supaya tetap terbaca untuk yang sulit membedakan warna
	if (status === "LUNAS") return <Check className={className} />;
	if (status === "PENDING") return <Clock className={className} />;
	return <X className={className} />;
}

/** Gabungkan beberapa tagihan (Buku/Registrasi) jadi satu status: merah > oranye > hijau. */
function statusGabungan(
	items: { status: StatusPembayaran }[],
): StatusPembayaran | null {
	if (items.length === 0) return null;
	if (items.some((i) => i.status === "BELUM_LUNAS")) return "BELUM_LUNAS";
	if (items.some((i) => i.status === "PENDING")) return "PENDING";
	return "LUNAS";
}

/** Tanggal singkat di dalam sel: tanggal bayar (lunas) atau jatuh tempo (belum). */
function tanggalSingkat(s: PembayaranSpp): string {
	const tanggal =
		s.statusBayar === "LUNAS" ? s.tanggalBayar : s.tanggalJatuhTempo;
	return tanggal ? formatToWITA(tanggal, "DD/MM") : "";
}

function detailSpp(s: PembayaranSpp) {
	const lunas = s.statusBayar === "LUNAS";
	return {
		judul: `${s.label} · ${toRupiah(s.jumlahBayar)}`,
		status: LABEL_STATUS[s.statusBayar],
		tanggal: lunas
			? s.tanggalBayar
				? `Dibayar ${formatDateWITA(s.tanggalBayar)}`
				: null
			: `Jatuh tempo ${formatDateWITA(s.tanggalJatuhTempo)}`,
	};
}

/** Nomor pembayaran SPP terbesar di antara semua siswa (= jumlah kolom SPP). */
function maksimumKe(data: RingkasanMurid[]): number {
	return data.reduce(
		(max, m) => Math.max(max, ...m.spp.map((s) => s.pembayaranKe), 0),
		0,
	);
}

// Kelas garis sel ala spreadsheet (border-separate agar garis tetap terlihat saat di-scroll)
const SEL = "border-b border-r";

/** Warna sel nama siswa menurut status (nama status muncul saat di-hover). */
const WARNA_STATUS: Record<StatusPendaftaran, string> = {
	AKTIF: "bg-(--badge-aktif-bg) text-(--badge-aktif-fg)",
	NON_AKTIF: "bg-(--badge-non-aktif-bg) text-(--badge-non-aktif-fg)",
	TRIAL: "bg-(--badge-trial-bg) text-(--badge-trial-fg)",
	WAITING_LIST: "bg-(--badge-waiting-list-bg) text-(--badge-waiting-list-fg)",
	OFF_SEMENTARA: "bg-(--badge-off-bg) text-(--badge-off-fg)",
};
const SEL_KOSONG =
	"flex h-9 items-center justify-center bg-muted/30 text-xs text-muted-foreground";

export function PembayaranGridKelas({
	data,
	onEditSpp,
	onTambah,
	onBukaRincian,
}: PembayaranGridKelasProps) {
	// Kolom = pembayaran ke-1 sampai ke-N (N = terbesar di antara semua siswa)
	const maxKe = maksimumKe(data);
	const kolomKe = Array.from({ length: Math.max(maxKe, 1) }, (_, i) => i + 1);

	const sel = (
		jenis: "buku" | "registrasi",
		label: JenisRincian,
		murid: RingkasanMurid,
	) => {
		const items = murid[jenis];
		const st = statusGabungan(items);
		if (!st) {
			return (
				<td key={jenis} className={cn(SEL, "p-0")}>
					<div className={SEL_KOSONG}>-</div>
				</td>
			);
		}
		// Tanggal lunas = tanggal bayar terakhir dari tagihan yang sudah lunas
		const tglLunas =
			st === "LUNAS"
				? items
						.filter((i) => i.tanggalBayar)
						.map((i) => new Date(i.tanggalBayar as Date))
						.sort((a, b) => b.getTime() - a.getTime())[0]
				: undefined;

		return (
			<td key={jenis} className={cn(SEL, "p-0")}>
				<button
					type="button"
					onClick={() => onBukaRincian(murid.muridId, label)}
					className={cn(
						"flex h-9 w-full min-w-28 items-center justify-center gap-1 px-2 text-xs font-medium whitespace-nowrap",
						ISI_STATUS[st],
					)}
				>
					<IkonStatus status={st} className="h-3.5 w-3.5" />
					{/* Lunas: langsung tanggal & bulan (seperti SPP); selain itu tulis statusnya */}
					{tglLunas
						? formatToWITA(tglLunas, "DD/MM")
						: items.length > 1
							? `${items.length} tagihan`
							: LABEL_STATUS[st]}
				</button>
			</td>
		);
	};

	return (
		<TooltipProvider delayDuration={150}>
			<div className="space-y-2">
				{/* Tabel gaya spreadsheet: header & kolom nama dibekukan, scroll ke samping/bawah */}
				<div className="bg-background max-h-[70vh] max-w-full overflow-auto rounded-md border-t border-l">
					<table className="w-max min-w-full border-separate border-spacing-0 text-sm">
						<thead>
							<tr>
								<th
									className={cn(
										SEL,
										"bg-muted sticky top-0 left-0 z-30 w-10 min-w-10 px-1 py-2 text-center text-xs font-semibold",
									)}
								>
									No
								</th>
								<th
									className={cn(
										SEL,
										"bg-muted sticky top-0 left-10 z-30 min-w-48 px-2 py-2 text-left text-xs font-semibold",
									)}
								>
									Nama Siswa
								</th>
								<th
									title="Sisa jumlah pertemuan"
									className={cn(
										SEL,
										"bg-muted sticky top-0 z-20 w-16 min-w-16 px-1 py-2 text-center text-xs leading-tight font-semibold",
									)}
								>
									Sisa
								</th>
								{kolomKe.map((ke) => (
									<th
										key={ke}
										className={cn(
											SEL,
											"bg-muted sticky top-0 z-20 min-w-24 px-2 py-2 text-center text-xs font-semibold whitespace-nowrap",
										)}
									>
										SPP {ke}
									</th>
								))}
								<th
									className={cn(
										SEL,
										"bg-muted sticky top-0 z-20 min-w-24 px-2 py-2 text-center text-xs font-semibold",
									)}
								>
									Buku
								</th>
								<th
									className={cn(
										SEL,
										"bg-muted sticky top-0 z-20 min-w-24 px-2 py-2 text-center text-xs font-semibold",
									)}
								>
									Registrasi
								</th>
								<th
									className={cn(
										SEL,
										"bg-muted sticky top-0 z-20 min-w-32 px-2 py-2 text-right text-xs font-semibold whitespace-nowrap",
									)}
								>
									Sisa Tagihan
								</th>
								<th
									className={cn(
										SEL,
										"bg-muted sticky top-0 z-20 w-10 min-w-10 p-0",
									)}
								/>
							</tr>
						</thead>

						<tbody>
							{data.map((murid, index) => {
								const sppByKe = new Map(
									murid.spp.map((s) => [s.pembayaranKe, s]),
								);

								return (
									<tr key={murid.muridId} className="group">
										<td
											className={cn(
												SEL,
												"bg-muted text-muted-foreground sticky left-0 z-10 w-10 min-w-10 px-1 text-center text-xs",
											)}
										>
											{index + 1}
										</td>
										<td
											title={
												murid.statusPendaftaran
													? formatStatus(murid.statusPendaftaran)
													: undefined
											}
											className={cn(
												SEL,
												"sticky left-10 z-10 min-w-48 px-2 py-1.5 font-medium",
												murid.statusPendaftaran
													? cn(
															WARNA_STATUS[murid.statusPendaftaran],
															"group-hover:brightness-95",
														)
													: "bg-background group-hover:bg-muted",
											)}
										>
											<div className="flex flex-wrap items-baseline gap-x-1.5">
												<span>{murid.namaLengkap}</span>
												<span className="text-xs font-normal whitespace-nowrap opacity-70">
													{labelUmurTahun(
														murid.tanggalLahir,
														murid.umur,
														murid.createdAt,
													)}
												</span>
											</div>
										</td>

										<td className={cn(SEL, "px-1 text-center")}>
											{murid.sisaPertemuan === null ? (
												<span
													title="Tidak dibatasi kuota"
													className="text-muted-foreground"
												>
													-
												</span>
											) : (
												<span
													className={cn(
														"inline-flex min-w-8 items-center justify-center rounded-md px-1.5 py-0.5 text-sm font-semibold",
														murid.sisaPertemuan <= 0
															? "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300"
															: murid.sisaPertemuan <= 2
																? "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/50 dark:text-yellow-300"
																: "bg-muted text-foreground",
													)}
												>
													{murid.sisaPertemuan}
												</span>
											)}
										</td>

										{kolomKe.map((ke) => {
											const s = sppByKe.get(ke);
											if (!s) {
												return (
													<td key={ke} className={cn(SEL, "p-0")}>
														<div className={SEL_KOSONG}>-</div>
													</td>
												);
											}
											const d = detailSpp(s);
											return (
												<td key={ke} className={cn(SEL, "p-0")}>
													<Tooltip>
														<TooltipTrigger asChild>
															<button
																type="button"
																onClick={() => onEditSpp(s)}
																className={cn(
																	"flex h-9 w-full min-w-24 items-center justify-center gap-1 px-2 text-xs font-medium",
																	ISI_STATUS[s.statusBayar],
																)}
															>
																<IkonStatus
																	status={s.statusBayar}
																	className="h-3.5 w-3.5"
																/>
																{tanggalSingkat(s)}
															</button>
														</TooltipTrigger>
														<TooltipContent>
															<p className="font-semibold">{d.judul}</p>
															<p>{d.status}</p>
															{d.tanggal && <p>{d.tanggal}</p>}
														</TooltipContent>
													</Tooltip>
												</td>
											);
										})}

										{sel("buku", "BUKU", murid)}
										{sel("registrasi", "REGISTRASI", murid)}

										<td
											className={cn(
												SEL,
												"px-2 text-right text-sm font-semibold whitespace-nowrap",
											)}
										>
											{murid.totalBelumLunas > 0 ? (
												<span className="text-red-600">
													{toRupiah(murid.totalBelumLunas)}
												</span>
											) : (
												<span className="text-green-700">Lunas</span>
											)}
										</td>

										<td className={cn(SEL, "p-0 text-center")}>
											<Button
												variant="ghost"
												size="icon"
												className="text-primary h-9 w-10 rounded-none"
												onClick={() => onTambah(murid)}
											>
												<Plus className="h-4 w-4" />
											</Button>
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>
			</div>
		</TooltipProvider>
	);
}
