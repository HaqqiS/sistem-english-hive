import dayjs from "dayjs";
import type { Metadata } from "next";
import DetailGuruClient from "@/app/_components/views/admin/guru/detail/detail-guru-client";
import { api, HydrateClient } from "@/trpc/server";

interface PageProps {
	params: Promise<{ guruId: string }>;
}

export async function generateMetadata({
	params,
}: PageProps): Promise<Metadata> {
	const { guruId } = await params;

	// Fetch data ringkas untuk judul (pastikan ini cepat/cached)
	const guru = await api.user
		.getAllGuruComplete()
		.then((data) => data.find((g) => g.id === guruId));

	return {
		title: guru ? `Detail Gaji | ${guru.name}` : "Detail Guru",
	};
}

export const revalidate = 0;

export default async function DetailGuruPage({ params }: PageProps) {
	const { guruId } = await params;
	const currentMonth = dayjs().format("YYYY-MM");

	await Promise.all([
		api.user.getAllGuruComplete.prefetch({}),
		api.absenGuru.getHistoryByGuruId.prefetch({
			guruId: guruId,
			month: currentMonth,
		}),
	]);

	return (
		<div className="flex flex-1 flex-col gap-4 p-4 pt-0">
			<main className="flex flex-1 flex-col gap-4 pt-6">
				<HydrateClient>
					<DetailGuruClient />
				</HydrateClient>
			</main>
		</div>
	);
}
