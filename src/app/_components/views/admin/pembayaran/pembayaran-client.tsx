"use client";
import { DataTable } from "@/app/_components/shared/data-table-generic";
import { api } from "@/trpc/react";
import { columns } from "./columns-pembayaran";

export default function PembayaranClient() {
  const { data: dataPembayaranJatuhTempo } =
    api.pembayaran.getTagihanJatuhTempo.useQuery();
  // console.table(dataPembayaran);
  // console.table(dataPembayaranJatuhTempo);

  const pembayaranColumns = columns({
    onDeleteClick: (id: string) => {
      console.log("Delete clicked for pembayaran with id:", id);
    },
    onEditClick: (item) => {
      console.log("Edit clicked for pembayaran:", item);
    },
  });

  return (
    <div>
      <DataTable
        data={dataPembayaranJatuhTempo ?? []}
        columns={pembayaranColumns}
      />
    </div>
  );
}
