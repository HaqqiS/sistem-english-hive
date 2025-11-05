import ProgramKelasClient from "@/app/_components/views/admin/kelas/program-kelas-client";
import { api, HydrateClient } from "@/trpc/server";

// const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default async function KelasPage() {
  // await delay(600000);

  // const dataProgramKelas = await getData();
  const dataKelas = await api.kelas.getAll();
  const dataPendaftaranKelas = await api.pendaftaranKelas.getAll();

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <main className="flex flex-1 flex-col gap-4 pt-0">
        <HydrateClient>
          <ProgramKelasClient
            initialDataProgram={dataKelas}
            initialDataPendaftaran={dataPendaftaranKelas}
          />
        </HydrateClient>
      </main>
    </div>
  );
}
