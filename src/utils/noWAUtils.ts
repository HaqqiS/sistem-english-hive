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
) => {
	if (!noWA) return "#";

	// Format nomor HP
	let formatted = noWA.trim();
	if (formatted.startsWith("0")) {
		formatted = `62${formatted.substring(1)}`;
	}

	// Template Pesan
	const text = `Kepada Yth. Bapak/Ibu orang tua/wali murid *English Hive*.\n\nKami ingin mengingatkan tagihan ${tipe} untuk:\nNama: *${namaMurid}*\nKelas: *${kelas}*\nNominal: *${toRupiah(
		jumlah,
	)}*\nJatuh Tempo: *${jatuhTempo ? formatDateWITA(jatuhTempo) : "-"}*\n\nBerikut detail rekening untuk pembayarannya ya, kak:\nBank: ${bank || "Mandiri"}\nNo. Rekening: ${noRekening || "1750080088080"}\nAtas nama: ${atasNama || "DESAK PUTU EKA PRATI"}\n\nMohon segera melakukan dan *mengirimkan Bukti Pembayaran*. Terima kasih`;

	const encodedText = encodeURIComponent(text);

	return `https://wa.me/${formatted.replace(/[^0-9]/g, "")}?text=${encodedText}`;
};
