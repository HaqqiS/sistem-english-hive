import DetailKelasClient from "@/app/_components/views/admin/kelas/detailKelas/detail-kelas-client";
import { api } from "@/trpc/server";
import { HydrateClient } from "@/trpc/server";

export default async function DetailKelasPage({
  params,
}: {
  params: Promise<{ kelasId: string }>;
}) {
  const { kelasId } = await params;

  await Promise.all([
    api.kelas.getKelasById.prefetch({ id: kelasId }),
    api.pendaftaranKelas.getPendaftarByKelasId.prefetch({ kelasId: kelasId }),
    api.historyGuruKelas.getHistoryGuruByKelasId.prefetch({ kelasId: kelasId }),
  ]);
  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <main className="flex flex-1 flex-col gap-4 pt-0">
        <HydrateClient>
          <DetailKelasClient />
        </HydrateClient>
      </main>
    </div>
  );
}
