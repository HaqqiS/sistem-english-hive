import type { Metadata } from "next";
import { api, HydrateClient } from "@/trpc/server";
import DashboardClientPage from "./dashboard-client";

export const metadata: Metadata = {
	title: "Dashboard Admin",
};

export default async function AdminDashboardPage() {
	await api.pembayaran.getTagihanJatuhTempo.prefetch({});

	return (
		<div className="flex flex-1 flex-col gap-4 p-4">
			<main className="flex flex-1 flex-col gap-4 pt-0">
				<HydrateClient>
					<DashboardClientPage />
				</HydrateClient>
			</main>
		</div>
	);
}
