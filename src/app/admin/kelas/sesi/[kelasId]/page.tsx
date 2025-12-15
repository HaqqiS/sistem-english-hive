import type { Metadata } from "next";
import DetailSesiClient from "@/app/_components/views/admin/kelas/sesi/detail-sesi-client";
import { api, HydrateClient } from "@/trpc/server";

interface PageProps {
	params: Promise<{ kelasId: string }>;
}

export async function generateMetadata({
	params,
}: PageProps): Promise<Metadata> {
	const { kelasId } = await params;

	// Fetch data ringkas untuk judul (pastikan ini cepat/cached)
	const kelas = await api.kelas.getKelasById({ id: kelasId });

	return {
		title: kelas ? `Detail Sesi | ${kelas.kodeKelas}` : "Detail Sesi Kelas",
	};
}

export default async function DetailSesiPertemuanKelasPage({
	params,
}: PageProps) {
	const { kelasId } = await params;

	await api.sesiPertemuan.getSesiSummaryByKelasId.prefetch({
		kelasId: kelasId,
	});

	return (
		<div className="flex flex-1 flex-col gap-4 p-4">
			<main className="flex flex-1 flex-col gap-4 pt-0">
				<HydrateClient>
					<DetailSesiClient />
				</HydrateClient>
			</main>
		</div>
	);
}
