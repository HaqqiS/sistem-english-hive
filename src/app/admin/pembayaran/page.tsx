import PembayaranClient from "@/app/_components/views/admin/pembayaran/pembayaran-client";
import { api, HydrateClient } from "@/trpc/server";

export default async function KelasPage() {
  // const dataPembayaran = await api.pembayaran.getAllPaginated({
  //   pageIndex: 0,
  //   pageSize: 10,
  // });

  await api.pembayaran.getAllPaginated.prefetch({
    pageIndex: 0,
    pageSize: 10,
  });

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <main className="flex flex-1 flex-col gap-4 pt-0">
        <HydrateClient>
          <PembayaranClient
          //  initialDataPembayaran={dataPembayaran}
          />
        </HydrateClient>
      </main>
    </div>
  );
}
