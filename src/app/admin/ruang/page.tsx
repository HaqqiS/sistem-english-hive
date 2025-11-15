import RuangClient from "@/app/_components/views/admin/ruang/ruang-client";
import { api, HydrateClient } from "@/trpc/server";

// const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default async function RuangPage() {
  const defaultPagination = { pageIndex: 0, pageSize: 10 };
  const defaultPaginationCabang = { pageIndex: 0, pageSize: 5 };

  const dataCabang = await api.cabang.getAllPaginated.prefetch(
    defaultPaginationCabang,
  );

  const [cabang, ruang, jamTetap, jamCustom] = await Promise.all([
    api.cabang.getAllPaginated(defaultPaginationCabang),
    api.ruang.getRuangByCabangId({ cabangId: "all" }),
    api.jam.getAllJamTetap(),
    api.jam.getAllJamCustom(),
  ]);

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <main className="flex flex-1 flex-col gap-4 pt-0">
        <HydrateClient>
          <RuangClient
            initialDataCabang={cabang}
            initialDataRuang={ruang}
            initialDataJamTetap={jamTetap}
            initialDataJamCustom={jamCustom}
          />
        </HydrateClient>
      </main>
    </div>
  );
}
