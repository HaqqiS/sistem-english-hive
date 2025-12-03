import RuangClient from "@/app/_components/views/admin/ruang/ruang-client";
import { api, HydrateClient } from "@/trpc/server";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kelola Ruang",
};

export default async function RuangPage() {
  await Promise.all([
    api.cabang.getAll.prefetch(),
    api.ruang.getRuangByCabangId.prefetch({ cabangId: "all" }),
    api.jam.getAllJamTetap.prefetch(),
    api.jam.getAllJamCustom.prefetch(),
  ]);

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <main className="flex flex-1 flex-col gap-4 pt-0">
        <HydrateClient>
          <RuangClient />
        </HydrateClient>
      </main>
    </div>
  );
}
