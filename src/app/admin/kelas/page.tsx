import type { Metadata } from "next";
import KelasClient from "@/app/_components/views/admin/kelas/kelas-client";
import { api, HydrateClient } from "@/trpc/server";

export const metadata: Metadata = {
	title: "Kelola Kelas",
};

export default async function KelasPage() {
	await Promise.all([
		api.kelas.getKelasAndCount.prefetch({}),
		api.jenisKelas.getJenisKelasList.prefetch(),
	]);

	return (
		<div className="flex flex-1 flex-col gap-4 p-4">
			<main className="flex flex-1 flex-col gap-4 pt-0">
				<HydrateClient>
					<KelasClient />
				</HydrateClient>
			</main>
		</div>
	);
}
