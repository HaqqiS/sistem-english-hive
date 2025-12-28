import type { Metadata } from "next";
import KelasPageContent from "@/app/_components/views/admin/kelas/kelas-page-content";
import { api, HydrateClient } from "@/trpc/server";

export const metadata: Metadata = {
	title: "Kelas Waiting List | Admin",
};

export default async function KelasWaitingPage() {
	await Promise.all([
		api.kelas.getKelasWaitingAndCount.prefetch({}),
		api.jenisKelas.getJenisKelasList.prefetch(),
	]);

	return (
		<HydrateClient>
			<KelasPageContent viewMode="waiting" />
		</HydrateClient>
	);
}
