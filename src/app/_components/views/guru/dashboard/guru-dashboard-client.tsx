"use client";

import { PengambilanBukuSection } from "../buku/pengambilan-buku-client";
import GuruOverview from "./guru-overview";

/**
 * Dashboard guru: ringkasan (sapaan, statistik, kelas aktif, tindak lanjut)
 * dan Pengambilan Buku. Jadwal Hari Ini ada di halaman terpisah:
 * /guru/jadwal-hari-ini.
 */
export default function GuruDashboardClient() {
	return (
		<div className="space-y-4">
			<GuruOverview />

			{/* Pengambilan Buku — muncul otomatis kalau ada buku READY untuk kelas guru ini */}
			<PengambilanBukuSection />
		</div>
	);
}
