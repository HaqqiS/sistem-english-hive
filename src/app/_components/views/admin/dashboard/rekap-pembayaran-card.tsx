"use client";

import { Banknote, Landmark, QrCode, TicketPercent } from "lucide-react";
import { useState } from "react";
import { MonthPickerString } from "@/app/_components/shared/MonthPickerString";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useGlobalCabangStore } from "@/store/useGlobalCabangStore";
import { api } from "@/trpc/react";
import dayjs, { TIMEZONE_BISNIS } from "@/utils/dateUtils";
import { toRupiah } from "@/utils/toRupiah";

const METODE_TILES = [
	{ key: "CASH", label: "Cash", icon: Banknote },
	{ key: "TRANSFER", label: "Transfer", icon: Landmark },
	{ key: "QRIS", label: "QRIS", icon: QrCode },
] as const;

/**
 * Rekap pembayaran LUNAS per bulan: total nominal tagihan per metode
 * (Cash / Transfer / QRIS) + total diskon. Diskon TIDAK mengurangi total;
 * keduanya ditampilkan terpisah.
 */
export default function RekapPembayaranCard() {
	const { activeCabangId } = useGlobalCabangStore();
	const [bulan, setBulan] = useState(() =>
		dayjs().tz(TIMEZONE_BISNIS).format("YYYY-MM"),
	);

	const { data, isLoading, isFetching } =
		api.dashboard.getRekapPembayaran.useQuery({
			cabangId:
				activeCabangId === "ALL" || !activeCabangId
					? undefined
					: activeCabangId,
			bulan,
		});

	const belumDicatat = data?.perMetode.BELUM_DICATAT;

	return (
		<Card>
			<CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
				<div className="space-y-1">
					<CardTitle>Rekap Pembayaran per Metode</CardTitle>
					<CardDescription>
						Tagihan lunas (SPP, Buku, Registrasi, Lainnya). Diskon dicatat
						terpisah dan tidak mengurangi total.
					</CardDescription>
				</div>
				<div className="w-full sm:w-48">
					<MonthPickerString value={bulan} onChange={setBulan} />
				</div>
			</CardHeader>

			<CardContent className="space-y-4">
				{isLoading || !data ? (
					<div className="grid gap-3 sm:grid-cols-3">
						<Skeleton className="h-28 rounded-xl" />
						<Skeleton className="h-28 rounded-xl" />
						<Skeleton className="h-28 rounded-xl" />
					</div>
				) : (
					<>
						<div
							className={`grid gap-3 transition-opacity sm:grid-cols-3 ${isFetching ? "opacity-60" : ""}`}
						>
							{METODE_TILES.map(({ key, label, icon: Icon }) => {
								const m = data.perMetode[key];
								return (
									<div key={key} className="space-y-2 rounded-xl border p-4">
										<div className="text-muted-foreground flex items-center justify-between text-sm font-medium">
											<span>{label}</span>
											<Icon className="h-4 w-4" />
										</div>
										<div className="text-2xl font-bold">
											{toRupiah(m.total)}
										</div>
										<div className="text-muted-foreground flex items-center justify-between text-xs">
											<span>{m.jumlahTransaksi} transaksi</span>
											<span>Diskon {toRupiah(m.diskon)}</span>
										</div>
									</div>
								);
							})}
						</div>

						<div className="grid gap-3 sm:grid-cols-2">
							<div className="bg-muted/50 flex items-center justify-between rounded-xl px-4 py-3">
								<span className="text-sm font-medium">Total Semua Metode</span>
								<span className="text-lg font-bold">
									{toRupiah(data.totalSemuaMetode)}
								</span>
							</div>
							<div className="flex items-center justify-between rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3">
								<span className="flex items-center gap-2 text-sm font-medium">
									<TicketPercent className="h-4 w-4" />
									Total Diskon
								</span>
								<span className="text-lg font-bold">
									{toRupiah(data.totalDiskon)}
								</span>
							</div>
						</div>

						<div className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-xs">
							<span>Diskon per jenis:</span>
							<span>SPP {toRupiah(data.diskonPerJenis.spp)}</span>
							<span>Buku {toRupiah(data.diskonPerJenis.buku)}</span>
							<span>Registrasi {toRupiah(data.diskonPerJenis.registrasi)}</span>
							<span>Lainnya {toRupiah(data.diskonPerJenis.lainnya)}</span>
						</div>

						{belumDicatat && belumDicatat.jumlahTransaksi > 0 && (
							<p className="text-muted-foreground rounded-md border border-dashed px-3 py-2 text-xs">
								{belumDicatat.jumlahTransaksi} transaksi senilai{" "}
								{toRupiah(belumDicatat.total)} belum memiliki metode pembayaran
								(data pelunasan sebelum fitur ini). Edit transaksinya untuk
								melengkapi.
							</p>
						)}
					</>
				)}
			</CardContent>
		</Card>
	);
}