"use client";

import { DataTable } from "@/app/_components/shared/data-table";
import { columns } from "./columns-jadwal-sesi";
import type { SesiPertemuanType } from "@/types/sesiPertemuan.type";
import { useSesiPertemuan } from "@/hooks/useSesiPertemuan";

interface AbsenClientProps {
  initialData: SesiPertemuanType[];
}

export default function AbsenMuridClient({ initialData }: AbsenClientProps) {
  const { dataSesiPertemuan } = useSesiPertemuan({
    initialData,
  });

  const columnsSesiPertemuan = columns({
    onEditClick: (item) => {
      console.log(item);
    },
    onDeleteClick: (id) => {
      console.log(id);
    },
  });
  // const columnsAbsensiGuru = columns({
  //   onEditClick: (item) => {
  //     console.log(item);
  //   },
  //   onDeleteClick: (id) => {
  //     console.log(id);
  //   },
  //   onStatusChange: (item, status) => {
  //     console.log(item, status);
  //     mutations.updateStatus.mutate({
  //       absensiId: item.id,
  //       isVerified: status,
  //     });
  //   },
  //   isPendingStatusChange: mutations.updateStatus.isPending,
  // });
  return (
    <div>
      <div className="flex space-x-2">{/* <TambahJadwalSesi /> */}</div>

      <DataTable
        // filterColumnId="isVerified"
        // filterColumnPlaceholder="Filter Status..."
        columns={columnsSesiPertemuan}
        data={initialData ?? []}
        toolbar={(table) => (
          <div className="flex items-center gap-2">
            {/* <Input
              placeholder="Cari nama cabang..."
              value={
                (table.getColumn("namaCabang")?.getFilterValue() as string) ??
                ""
              }
              onChange={(event) =>
                table
                  .getColumn("namaCabang")
                  ?.setFilterValue(event.target.value)
              }
              className="max-w-sm"
            /> */}
          </div>
        )}
      />
    </div>
  );
}
