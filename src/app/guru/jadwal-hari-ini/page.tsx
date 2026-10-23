import type { Metadata } from "next";
import GuruJadwalHariIniClient from "@/app/_components/views/guru/dashboard/guru-jadwal-hari-ini-client";
import { api, HydrateClient } from "@/trpc/server";

export const metadata: Metadata = {
	title: "Jadwal Hari Ini",
};

// Pastikan data selalu fresh untuk guru
export const revalidate = 0;

export default async function GuruJadwalHariIniPage() {
	// Prefetch data yang dibutuhkan di server
	await Promise.all([
		api.jadwalKelas.getJadwalHariIniForGuru.prefetch({}),
		api.ruang.getAll.prefetch({}), // Dibutuhkan untuk dialog "Ganti Ruang"
	]);

	return (
		<div className="flex flex-1 flex-col gap-4 p-4">
			<main className="flex flex-1 flex-col gap-4">
				<HydrateClient>
					<GuruJadwalHariIniClient />
				</HydrateClient>
			</main>
		</div>
	);
}
