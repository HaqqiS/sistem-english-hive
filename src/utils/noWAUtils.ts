import { formatDateWITA } from "@/utils/dateUtils";
import { toRupiah } from "@/utils/toRupiah";

export const formatWhatsAppLink = (noWA: string) => {
	if (!noWA) return "#";
	let formatted = noWA.trim();
	if (formatted.startsWith("0")) {
		formatted = `62${formatted.substring(1)}`;
	}
	return `https://wa.me/${formatted.replace(/[^0-9]/g, "")}`;
};

// Helper untuk membuat Link WA dengan Template Pesan
export const formatWhatsAppReminder = (
	noWA: string,
	namaMurid: string,
	tipe: string,
	kelas: string,
	jumlah: number,
	jatuhTempo?: Date | null,
	noRekening?: string | null,
	bank?: string | null,
	atasNama?: string | null,
	pembayaranKe?: number | null,
	level?: number | null,
) => {
	if (!noWA) return "#";

	// Format nomor HP
	let formatted = noWA.trim();
	if (formatted.startsWith("0")) {
		formatted = `62${formatted.substring(1)}`;
	}

	// Logika Teks Info Dinamis
	let infoText = "";
	if (pembayaranKe === 1) {
		if (level === 1) {
			infoText =
				"Sebagai informasi, saat ini ananda baru mendaftar, Pembayaran ini berlaku untuk 8 kali pertemuan selanjutnya.";
		} else if (level && level >= 2) {
			infoText = `Sebagai informasi, saat ini ananda sudah memasuki pertemuan ke-20, dan kami menetapkan tenggat pembayaran di pertemuan ke-24. Pembayaran ini berlaku untuk 8 kali pertemuan selanjutnya di level ${level}.`;
		}
	} else if (pembayaranKe === 2) {
		infoText =
			"Sebagai informasi, saat ini ananda sudah memasuki pertemuan ke-6, dan kami menetapkan tenggat pembayaran di pertemuan ke-8. Pembayaran ini berlaku untuk 8 kali pertemuan selanjutnya.";
	} else if (pembayaranKe === 3) {
		infoText =
			"Sebagai informasi, saat ini ananda sudah memasuki pertemuan ke-14, dan kami menetapkan tenggat pembayaran di pertemuan ke-16. Pembayaran ini berlaku untuk 8 kali pertemuan selanjutnya.";
	}

	// Template Pesan
	const text = `Kepada Yth. Bapak/Ibu orang tua/wali murid *English Hive*.\n\nKami ingin mengingatkan tagihan ${tipe} untuk:\nNama: *${namaMurid}*\nKelas: *${kelas}*\nNominal: *${toRupiah(
		jumlah,
	)}*\nJatuh Tempo: *${jatuhTempo ? formatDateWITA(jatuhTempo) : "-"}*\n\n${infoText ? `${infoText}\n\n` : ""}Berikut detail rekening untuk pembayarannya :\nBank: ${bank || "Mandiri"}\nNo. Rekening: ${noRekening || "1750080088080"}\nAtas nama: ${atasNama || "DESAK PUTU EKA PRATI"}\n\nMohon segera melakukan dan *mengirimkan Bukti Pembayaran*. Terima kasih`;

	const encodedText = encodeURIComponent(text);

	return `https://wa.me/${formatted.replace(/[^0-9]/g, "")}?text=${encodedText}`;
};

// Item tagihan generik untuk pesan WA gabungan (SPP + Buku + Registrasi)
export interface WaTagihanItem {
	label: string; // contoh: "SPP Ke-2", "Buku English Level 3", "Biaya Registrasi"
	jumlah: number;
	jatuhTempo?: Date | null;
}

/**
 * Membuat teks pesan (plain text) yang merangkum SEMUA tagihan
 * (SPP + Buku + Registrasi) milik 1 murid di 1 kelas, lengkap dengan total
 * keseluruhan. Dipakai untuk isi pesan WA maupun tombol "Salin Teks".
 */
export const buildTeksReminderGabungan = (
	namaMurid: string,
	kodeKelas: string,
	items: WaTagihanItem[],
	noRekening?: string | null,
	bank?: string | null,
	atasNama?: string | null,
	tenggatPembayaran?: Date | null,
) => {
	const total = items.reduce((sum, item) => sum + item.jumlah, 0);

	// Tenggat yang ditampilkan: pakai yang di-set eksplisit (mis. tenggat SPP
	// terdekat) kalau ada, kalau tidak ambil dari tanggal jatuh tempo termuda
	// di antara item-item tagihan.
	const nearestJatuhTempo =
		tenggatPembayaran ??
		items
			.map((item) => item.jatuhTempo)
			.filter((d): d is Date => !!d)
			.sort((a, b) => a.getTime() - b.getTime())[0];

	const rincian = items
		.map((item, index) => {
			const tempoText = item.jatuhTempo
				? ` (Jatuh Tempo: ${formatDateWITA(item.jatuhTempo)})`
				: "";
			return `${index + 1}. ${item.label}: *${toRupiah(item.jumlah)}*${tempoText}`;
		})
		.join("\n");

	return `Kepada Yth. Bapak/Ibu orang tua/wali murid *English Hive*.\n\nKami ingin mengingatkan tagihan untuk:\nNama: *${namaMurid}*\nKelas: *${kodeKelas}*\n\nRincian tagihan:\n${rincian}\n\n*Total Tagihan: ${toRupiah(
		total,
	)}*${nearestJatuhTempo ? `\nTenggat Pembayaran: *${formatDateWITA(nearestJatuhTempo)}*` : ""}\n\nBerikut detail rekening untuk pembayarannya ya, kak:\nBank: ${bank || "Mandiri"}\nNo. Rekening: ${noRekening || "1750080088080"}\nAtas nama: ${atasNama || "DESAK PUTU EKA PRATI"}\n\nMohon segera melakukan dan *mengirimkan Bukti Pembayaran*. Terima kasih`;
};

/**
 * Membuat 1 pesan WA yang merangkum SEMUA tagihan (SPP + Buku + Registrasi)
 * milik 1 murid di 1 kelas, lengkap dengan total keseluruhan.
 */
export const formatWhatsAppReminderGabungan = (
	noWA: string,
	namaMurid: string,
	kodeKelas: string,
	items: WaTagihanItem[],
	noRekening?: string | null,
	bank?: string | null,
	atasNama?: string | null,
	tenggatPembayaran?: Date | null,
) => {
	if (!noWA) return "#";
	if (items.length === 0) return "#";

	let formatted = noWA.trim();
	if (formatted.startsWith("0")) {
		formatted = `62${formatted.substring(1)}`;
	}

	const text = buildTeksReminderGabungan(
		namaMurid,
		kodeKelas,
		items,
		noRekening,
		bank,
		atasNama,
		tenggatPembayaran,
	);

	const encodedText = encodeURIComponent(text);

	return `https://wa.me/${formatted.replace(/[^0-9]/g, "")}?text=${encodedText}`;
};
