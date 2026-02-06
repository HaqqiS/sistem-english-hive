import { formatDateWITA } from "@/utils/dateUtils";
import { toRupiah } from "@/utils/toRupiah";

export const formatWhatsAppLink = (noWA: string) => {
	if (!noWA) return "#";
	let formatted = noWA.trim();
	if (formatted.startsWith("0")) {
		formatted = `62${formatted.substring(1)}`;
	} else if (!formatted.startsWith("62")) {
		formatted = `62${formatted}`;
	}
	return `https://wa.me/${formatted.replace(/[^0-9]/g, "")}`;
};

// Helper untuk membuat Link WA dengan Template Pesan
export const formatWhatsAppReminder = (
	noWA: string,
	namaMurid: string,
	tipe: string,
	jumlah: number,
	jatuhTempo?: Date,
) => {
	if (!noWA) return "#";

	// Format nomor HP
	let formatted = noWA.trim();
	if (formatted.startsWith("0")) {
		formatted = `62${formatted.substring(1)}`;
	} else if (!formatted.startsWith("62")) {
		formatted = `62${formatted}`;
	}

	// Template Pesan
	const text = `Halo Kak/Bapak/Ibu, kami dari *English Hive*.\n\nKami ingin mengingatkan tagihan ${tipe} untuk:\nNama: *${namaMurid}*\nNominal: *${toRupiah(
		jumlah,
	)}*\nJatuh Tempo: *${jatuhTempo ? formatDateWITA(jatuhTempo) : "-"}*\n\nBerikut detail rekening untuk pembayarannya ya, kak:\nBank: Mandiri\nNo. Rekening: 1750080088080\nAtas nama: DESAK PUTU EKA PRATI\n\nMohon segera melakukan dan *mengirimkan Bukti Pembayaran*. Terima kasih`;

	const encodedText = encodeURIComponent(text);

	return `https://wa.me/${formatted.replace(/[^0-9]/g, "")}?text=${encodedText}`;
};
