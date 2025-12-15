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
	jatuhTempo: Date,
	jumlah: number,
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
	const text = `Halo Kak/Bapak/Ibu, kami dari *English Hive*.\n\nKami ingin mengingatkan tagihan kursus untuk:\nNama: *${namaMurid}*\nNominal: *${toRupiah(jumlah)}*\nJatuh Tempo: *${formatDateWITA(jatuhTempo)}*\n\nMohon segera melakukan pembayaran. Terima kasih 🙏`;

	const encodedText = encodeURIComponent(text);

	return `https://wa.me/${formatted.replace(/[^0-9]/g, "")}?text=${encodedText}`;
};
