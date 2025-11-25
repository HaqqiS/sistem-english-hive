import DetailSesiClient from "@/app/_components/views/admin/sesi/detail-sesi-client";
import { api, HydrateClient } from "@/trpc/server";

export default async function DetailSesiPertemuanKelasPage({
  params,
}: {
  params: Promise<{ kelasId: string }>;
}) {
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
