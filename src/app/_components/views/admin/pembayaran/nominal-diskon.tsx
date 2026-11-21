import { toRupiah } from "@/utils/toRupiah";

interface NominalDiskonProps {
	/** Nominal tagihan penuh (tidak dikurangi diskon). */
	jumlah: number;
	/** Diskon yang dicatat untuk tagihan ini. */
	diskon?: number | null;
}

/**
 * Sel "Nominal" untuk tabel pembayaran: nominal tagihan penuh, dan jika ada
 * diskon, jumlahnya ditampilkan di bawah nominal. Diskon tidak mengurangi nominal.
 */
export function NominalDiskon({ jumlah, diskon }: NominalDiskonProps) {
	return (
		<div className="min-w-[100px]">
			<div className="font-medium">{toRupiah(jumlah)}</div>
			{diskon && diskon > 0 ? (
				<div className="text-xs font-medium text-amber-600 dark:text-amber-400">
					Diskon {toRupiah(diskon)}
				</div>
			) : null}
		</div>
	);
}
