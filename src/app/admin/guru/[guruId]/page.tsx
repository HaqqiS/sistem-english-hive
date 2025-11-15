import DetailGuruClient from "@/app/_components/views/admin/guru/detail/detail-guru-client";
import { api, HydrateClient } from "@/trpc/server";
import dayjs from "dayjs";

// Tambahkan revalidate = 0 agar data selalu baru saat admin me-refresh halaman
export const revalidate = 0;

export default async function DetailGuruPage({
  params,
}: {
  params: Promise<{ guruId: string }>;
}) {
  const { guruId } = await params;
  const currentMonth = dayjs().format("YYYY-MM");

  // Prefetch data guru dan history bulan ini di server
  await Promise.all([
    api.user.getAllGuru.prefetch(),
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
