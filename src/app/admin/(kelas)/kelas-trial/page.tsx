import type { Metadata } from "next";
import KelasPageContent from "@/app/_components/views/admin/kelas/kelas-page-content";
import { api, HydrateClient } from "@/trpc/server";

export const metadata: Metadata = {
	title: "Kelas Trial | Admin",
};

export default async function KelasTrialPage() {
	await Promise.all([
		api.kelas.getKelasTrialAndCount.prefetch({}),
		api.jenisKelas.getJenisKelasList.prefetch(),
	]);

	return (
		<HydrateClient>
			<KelasPageContent viewMode="trial" />
		</HydrateClient>
	);
}
