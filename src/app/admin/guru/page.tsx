import GuruClient from "@/app/_components/views/admin/guru/guru-client";
import { api, HydrateClient } from "@/trpc/server";

export default async function VerifikasiAbsenPage() {
  const dataAbsensiGuruPaginated = await api.absenGuru.getAllAbsensi({
    pageIndex: 0,
    pageSize: 10,
  });

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <main className="flex flex-1 flex-col gap-4 pt-0">
        <HydrateClient>
          <GuruClient initialData={dataAbsensiGuruPaginated} />
        </HydrateClient>
      </main>
    </div>
  );
}
