"use client";

import { DataTable } from "@/app/_components/shared/data-table-generic";
import { useKelas } from "@/hooks/useKelas";
import { api } from "@/trpc/react";
import { useParams } from "next/navigation";
import { columns } from "./columns";

export default function DetailKelasClient() {
  const { kelasId } = useParams<{ kelasId: string }>();
  const { dataById } = useKelas({ kelasId });
  const { data: dataKelas } =
    api.pendaftaranKelas.getPendaftarByKelasId.useQuery({
      kelasId,
    });

  const columnsDetailKelas = columns({
    onEditClick: (item) => {
      console.log("Edit clicked for:", item);
    },
    onDeleteClick: (pendaftaranId, namaLengkap) => {
      console.log(
        `Delete clicked for ID: ${pendaftaranId}, Name: ${namaLengkap}`,
      );
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between space-x-2 pt-4">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-xl">Detail Kelas {dataById?.kodeKelas}</h1>
            <p className="text-muted-foreground text-sm">
              This is the kelas management page.
            </p>
          </div>
        </header>
        {/* <TambahProgramKelas /> */}
      </div>

      <DataTable data={dataKelas ?? []} columns={columnsDetailKelas} />
    </div>
  );
}
