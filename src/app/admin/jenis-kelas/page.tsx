import type { Metadata } from "next";
import JenisKelasClient from "@/app/_components/views/admin/jenis-kelas/jenis-kelas-client";
import { api, HydrateClient } from "@/trpc/server";

export const metadata: Metadata = {
	title: "Kelola Jenis Kelas",
};

export default async function JenisKelasPage() {
	await Promise.all([api.jenisKelas.getJenisKelasList.prefetch()]);

	return (
		<div className="flex flex-1 flex-col gap-4 p-4">
			<main className="flex flex-1 flex-col gap-4 pt-0">
				<HydrateClient>
					<JenisKelasClient />
				</HydrateClient>
			</main>
		</div>
	);
}
