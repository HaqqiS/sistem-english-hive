import type { Metadata } from "next";
import KelasPageContent from "@/app/_components/views/admin/kelas/kelas-page-content";
import { api, HydrateClient } from "@/trpc/server";

export const metadata: Metadata = {
	title: "Kelas Running | Admin",
};

export default async function KelasRunningPage() {
	await Promise.all([
		api.kelas.getKelasAndCount.prefetch({}),
		// api.jadwalKelas.getAll.prefetch({}),
		api.jenisKelas.getJenisKelasList.prefetch(),
	]);

	return (
		<HydrateClient>
			<KelasPageContent viewMode="running" />
		</HydrateClient>
	);
}
