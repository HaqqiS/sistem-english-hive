import KelasClient from "@/app/_components/views/admin/kelas/kelas-client";
import { api, HydrateClient } from "@/trpc/server";

export default async function KelasPage() {
  await Promise.all([
    api.kelas.getKelasAktif.prefetch(),
    api.jadwalKelas.getAll.prefetch(),
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
