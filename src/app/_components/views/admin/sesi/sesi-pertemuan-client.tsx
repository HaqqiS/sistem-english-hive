"use client";

import { DataTable } from "@/app/_components/shared/data-table-generic";
import type {
  SesiPertemuanType,
  SesiPertemuanWithKelasCountType,
} from "@/types/sesiPertemuan.type";
import { columns as columnsSesi } from "./columns";
import TambahSesiPertemuan from "./tambah-sesi-pertemuan";
import { useSesiPertemuan } from "@/hooks/useSesiPertemuan";

interface SesiPertemuanClientProps {
  initialData: SesiPertemuanWithKelasCountType[];
}

export default function SesiPertemuanClient({
  initialData,
}: SesiPertemuanClientProps) {
  const columns = columnsSesi({
    onEditClick: (item) => {
      console.log("clicked");
    },
    // onDeleteClick: (cabangId, cabangName) => {
    //   console.log("deleted");
    // },
  });

  // const { dataSesiPertemuan } = useSesiPertemuan({
  //   initialData,
  // });

  return (
    <div>
      <div className="flex space-x-2">
        <TambahSesiPertemuan />
      </div>

      <DataTable
        // filterColumnId="kodeKelas"
        // filterColumnPlaceholder="Filter Nama Jadwal Sesi..."
        columns={columns}
        data={initialData ?? []}
        // toolbar={(table) => (
        //   <div className="flex items-center gap-2">
        //     {/* <Input
        //             placeholder="Cari nama cabang..."
        //             value={
        //               (table.getColumn("namaCabang")?.getFilterValue() as string) ??
        //               ""
        //             }
        //             onChange={(event) =>
        //               table
        //                 .getColumn("namaCabang")
        //                 ?.setFilterValue(event.target.value)
        //             }
        //             className="max-w-sm"
        //           /> */}
        //   </div>
        // )}
      />
    </div>
  );
}
