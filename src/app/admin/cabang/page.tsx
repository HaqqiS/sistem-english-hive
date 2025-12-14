import CabangClient from "@/app/_components/views/admin/cabang/cabang-client";
import { api, HydrateClient } from "@/trpc/server";
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Kelola Ruang",
};

export default async function CabangPage() {
	await Promise.all([api.cabang.getAll.prefetch()]);

	return (
		<div className="flex flex-1 flex-col gap-4 p-4">
			<main className="flex flex-1 flex-col gap-4 pt-0">
				<HydrateClient>
					<CabangClient />
				</HydrateClient>
			</main>
		</div>
	);
}
