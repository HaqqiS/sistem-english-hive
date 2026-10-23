import type { Metadata } from "next";
import GuruDashboardClient from "@/app/_components/views/guru/dashboard/guru-dashboard-client";
import { api, HydrateClient } from "@/trpc/server";

export const metadata: Metadata = {
	title: "Dashboard Guru",
};

// Pastikan data selalu fresh untuk guru
export const revalidate = 0;

export default async function GuruDashboard() {
	// Prefetch ringkasan guru di server (jadwal hari ini ada di /guru/jadwal-hari-ini)
	await api.absenGuru.getOverviewGuru.prefetch();

	return (
		<div className="flex flex-1 flex-col gap-4 p-4">
			<main className="flex flex-1 flex-col gap-4">
				<HydrateClient>
					<GuruDashboardClient />
				</HydrateClient>
			</main>
		</div>
	);
}
