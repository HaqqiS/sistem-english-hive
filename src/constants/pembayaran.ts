export const JUMLAH_PERTEMUAN_PER_BLOK = 8;
export const BATAS_SISA_UNTUK_TAGIHAN = 2;
export const BATAS_SESI = 24;

/** Metode pembayaran yang bisa dipilih admin saat melunasi tagihan. */
export const METODE_BAYAR_OPTIONS = [
	{ value: "CASH", label: "Cash" },
	{ value: "TRANSFER", label: "Transfer" },
	{ value: "QRIS", label: "QRIS" },
] as const;

export const METODE_BAYAR_LABEL: Record<string, string> = {
	CASH: "Cash",
	TRANSFER: "Transfer",
	QRIS: "QRIS",
	BELUM_DICATAT: "Belum dicatat",
};
