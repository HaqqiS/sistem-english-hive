import SesiPertemuanClient from "@/app/_components/views/admin/sesi/sesi-pertemuan-client";
import { api, HydrateClient } from "@/trpc/server";

// const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default async function SesiPage() {
  // await delay(600000);

  // const dataJadwalSesi = await getData();
  // console.log(dataJadwalSesi);
  const dataSesi = await api.sesiPertemuan.getKelasAndCount();

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <header className="flex items-center justify-between pt-6">
        <div>
          <h1 className="text-xl">Kelola Sesi Pertemuan Kelas</h1>
          <p className="text-muted-foreground text-sm">
            This is the sesi pertemuan kelas management page.
          </p>
        </div>
      </header>
      <main className="flex flex-1 flex-col gap-4 pt-0">
        <HydrateClient>
          <SesiPertemuanClient initialData={dataSesi} />
        </HydrateClient>
      </main>
    </div>
  );
}
