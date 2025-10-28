"use client";
import { api, type RouterOutputs } from "@/trpc/react";
import TambahCabang from "./tambah-cabang";

interface CabangClientProps {
  initialData: RouterOutputs["cabang"]["getAll"];
}

export default function CabangClient({ initialData }: CabangClientProps) {
  const { data: dataCabang } = api.cabang.getAll.useQuery(undefined, {
    initialData: initialData,
    refetchOnWindowFocus: false,
  });

  return (
    <>
      <div className="py-4">
        {/*
         * INI ADALAH KOMPONEN KLIEN
         * Ia bisa menggunakan hook, state, dan context tRPC.
         */}
        {/* <TambahCabang /> */}
      </div>

      {/*
       * INI JUGA KOMPONEN KLIEN
       * (Contoh tabel data Anda)
       */}
      <div className="bg-muted mt-4 rounded-lg p-4">
        <h3 className="font-semibold">Data dari useQuery (terhidrasi):</h3>
        <pre className="text-sm">{JSON.stringify(dataCabang, null, 2)}</pre>
      </div>
    </>
  );
}
