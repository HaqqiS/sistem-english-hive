import GuruClient from "@/app/_components/views/admin/guru/guru-client";
import { api, HydrateClient } from "@/trpc/server";

export default async function VerifikasiAbsenPage() {
  const [dataAbsensiGuruPaginated, dataGuru] = await Promise.all([
    api.absenGuru.getAllAbsensi({
      pageIndex: 0,
      pageSize: 10,
    }),
    api.user.getAllGuruComplete(),
  ]);

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <main className="flex flex-1 flex-col gap-4 pt-0">
        <HydrateClient>
          <GuruClient
            initialDataAbsensi={dataAbsensiGuruPaginated}
            initialDataGuru={dataGuru}
          />
        </HydrateClient>
      </main>
    </div>
  );
}
