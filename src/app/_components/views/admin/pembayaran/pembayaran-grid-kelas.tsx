"use client";

import type { StatusPembayaran } from "@prisma/client";
import { Check, Clock, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { RouterOutputs } from "@/trpc/react";
import { formatDateWITA, formatToWITA } from "@/utils/dateUtils";
import { toRupiah } from "@/utils/toRupiah";

type RingkasanMurid =
	RouterOutputs["pembayaran"]["getRingkasanKelas"]["data"][number];
type PembayaranSpp = RingkasanMurid["spp"][number];

export type JenisRincian = "BUKU" | "REGISTRASI";

interface PembayaranGridKelasProps {
	data: RingkasanMurid[];
	highlightMurid?: string;
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

// Kelas garis sel ala spreadsheet (border-separate agar garis tetap terlihat saat di-scroll)
const SEL = "border-b border-r";
const SEL_KOSONG =
	"flex h-9 items-center justify-center bg-muted/30 text-xs text-muted-foreground";

export function PembayaranGridKelas({
	data,
	highlightMurid,
	onEditSpp,
	onTambah,
	onBukaRincian,
}: PembayaranGridKelasProps) {
	// Kolom = pembayaran ke-1 sampai ke-N (N = terbesar di antara semua siswa)
	const maxKe = data.reduce(
		(max, m) => Math.max(max, ...m.spp.map((s) => s.pembayaranKe), 0),
		0,
	);
	const kolomKe = Array.from({ length: Math.max(maxKe, 1) }, (_, i) => i + 1);

	const term = highlightMurid?.trim().toLowerCase();
	const isHighlighted = (nama: string) =>
		!!term && nama.toLowerCase().includes(term);

	// Ringkasan baris bawah (seperti baris total di Excel)
	const lunasPerKolom = kolomKe.map((ke) => {
		const ada = data.flatMap((m) => m.spp.filter((s) => s.pembayaranKe === ke));
		return {
			lunas: ada.filter((s) => s.statusBayar === "LUNAS").length,
			total: ada.length,
		};
	});
	const ringkasJenis = (jenis: "buku" | "registrasi") => {
		const ada = data.filter((m) => m[jenis].length > 0);
		return {
			lunas: ada.filter((m) => statusGabungan(m[jenis]) === "LUNAS").length,
			total: ada.length,
		};
	};
	const ringkasBuku = ringkasJenis("buku");
	const ringkasReg = ringkasJenis("registrasi");
	const totalSisa = data.reduce((sum, m) => sum + m.totalBelumLunas, 0);

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
		return (
			<td key={jenis} className={cn(SEL, "p-0")}>
				<button
					type="button"
					onClick={() => onBukaRincian(murid.muridId, label)}
					className={cn(
						"flex h-9 w-full min-w-24 items-center justify-center gap-1 px-2 text-xs font-medium whitespace-nowrap",
						ISI_STATUS[st],
					)}
				>
					<IkonStatus status={st} className="h-3.5 w-3.5" />
					{items.length > 1 ? `${items.length} tagihan` : LABEL_STATUS[st]}
				</button>
			</td>
		);
	};

	return (
		<TooltipProvider delayDuration={150}>
			<div className="space-y-2">
				{/* Legenda */}
				<div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
					{(
						[
							["Lunas", "bg-green-600"],
							["Belum lunas", "bg-red-600"],
							["Pending", "bg-orange-500"],
							["Belum ada", "border border-dashed"],
						] as const
					).map(([label, cls]) => (
						<span key={label} className="flex items-center gap-1.5">
							<span className={cn("size-3.5 rounded-sm", cls)} />
							{label}
						</span>
					))}
					<span className="ml-auto hidden sm:inline">
						Angka di sel = tanggal bayar / jatuh tempo (dd/MM)
					</span>
				</div>

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
								const highlight = isHighlighted(murid.namaLengkap);

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
											className={cn(
												SEL,
												"sticky left-10 z-10 min-w-48 px-2 py-1.5 font-medium",
												highlight
													? "bg-primary/15"
													: "bg-background group-hover:bg-muted",
											)}
										>
											{murid.namaLengkap}
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

						<tfoot>
							<tr>
								<td
									colSpan={2}
									className={cn(
										SEL,
										"bg-muted sticky bottom-0 left-0 z-30 px-2 py-2 text-xs font-semibold",
									)}
								>
									Lunas / Total ({data.length} siswa)
								</td>
								{lunasPerKolom.map((r, i) => (
									<td
										key={kolomKe[i]}
										className={cn(
											SEL,
											"bg-muted sticky bottom-0 z-20 px-2 py-2 text-center text-xs font-semibold",
										)}
									>
										{r.lunas}/{r.total}
									</td>
								))}
								<td
									className={cn(
										SEL,
										"bg-muted sticky bottom-0 z-20 px-2 py-2 text-center text-xs font-semibold",
									)}
								>
									{ringkasBuku.lunas}/{ringkasBuku.total}
								</td>
								<td
									className={cn(
										SEL,
										"bg-muted sticky bottom-0 z-20 px-2 py-2 text-center text-xs font-semibold",
									)}
								>
									{ringkasReg.lunas}/{ringkasReg.total}
								</td>
								<td
									className={cn(
										SEL,
										"bg-muted sticky bottom-0 z-20 px-2 py-2 text-right text-xs font-semibold whitespace-nowrap",
									)}
								>
									{totalSisa > 0 ? (
										<span className="text-red-600">{toRupiah(totalSisa)}</span>
									) : (
										<span className="text-green-700">Lunas</span>
									)}
								</td>
								<td className={cn(SEL, "bg-muted sticky bottom-0 z-20 p-0")} />
							</tr>
						</tfoot>
					</table>
				</div>
			</div>
		</TooltipProvider>
	);
}
