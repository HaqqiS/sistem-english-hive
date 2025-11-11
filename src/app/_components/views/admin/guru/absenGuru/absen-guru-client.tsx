"use client";

import { DataTable } from "@/app/_components/shared/data-table";
import { columns } from "./columns-absen-guru";
import type { TypeAbsensiGuru } from "@/types/absenGuru.type";
import { useAbsenGuru } from "@/hooks/useAbsenGuru";

interface AbsenClientProps {
  initialData: TypeAbsensiGuru[];
}

export default function AbsenGuruClient({ initialData }: AbsenClientProps) {
  const { mutations } = useAbsenGuru({
    // onSuccessUpdate: () => {},
  });

  const { data: dataAbsensiGuru } = useAbsenGuru({
    initialDataAbsensi: initialData,
  });

  const columnsAbsensiGuru = columns({
    onEditClick: (item) => {
      console.log(item);
    },
    onDeleteClick: (id) => {
      console.log(id);
    },
    onStatusChange: (item, status) => {
      console.log(item, status);
      mutations.updateStatus.mutate({
        absensiId: item.id,
        isVerified: status,
      });
    },
    isPendingStatusChange: mutations.updateStatus.isPending,
  });
  return (
    <div>
      <div className="flex space-x-2">{/* <TambahJadwalSesi /> */}</div>

      <DataTable
        filterColumnId="isVerified"
        filterColumnPlaceholder="Filter Status..."
        columns={columnsAbsensiGuru}
        data={dataAbsensiGuru ?? []}
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
