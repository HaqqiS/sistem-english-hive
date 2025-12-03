import DetailKelasClient from "@/app/_components/views/admin/kelas/detailKelas/detail-kelas-client";
import { api } from "@/trpc/server";
import { HydrateClient } from "@/trpc/server";
import type { Metadata } from "next";

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
    title: kelas ? `Detail Kelas | ${kelas.kodeKelas}` : "Detail Kelas",
  };
}

export default async function DetailKelasPage({ params }: PageProps) {
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
