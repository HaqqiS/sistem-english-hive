import DetailKelasClient from "@/app/_components/views/admin/kelas/detailKelas/detail-kelas-client";
import { HydrateClient } from "@/trpc/server";

export default function DetailKelasPage() {
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
