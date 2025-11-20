"use client";

import { useState } from "react";
import { DataTable } from "@/app/_components/shared/data-table-generic";
import { api } from "@/trpc/react";
import { columns } from "./columns-pembayaran";
import { StatusPembayaran } from "@prisma/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { DeleteConfirmationDialog } from "@/app/_components/shared/delete-confirmation-dialog";
import { type TypePembayaran } from "@/types/pembayaran.type";
import { toRupiah } from "@/utils/toRupiah";
import { usePembayaran } from "@/hooks/usePembayaran";
import { usePembayaranStore } from "@/store/usePembayaranStore";
import EditPembayaran from "./edit-pembayaran";

export default function PembayaranClient() {
  // --- STATE ---
  const [statusFilter, setStatusFilter] = useState<StatusPembayaran | "ALL">(
    "ALL",
  );
  const { openDrawer } = usePembayaranStore();

  // State Delete
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<TypePembayaran | null>(null);

  // --- HOOKS/QUERIES/MUTATIONS ---
  const {
    dataGetAll: dataPembayaran,
    isLoadingGetAll: isLoading,
    refetchGetAll: refetch,
    mutations,
  } = usePembayaran({
    statusFilter: statusFilter !== "ALL" ? statusFilter : undefined,
    enableGetAll: true,
    onSuccessDelete: () => {
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    },
  });

  // --- HANDLERS ---
  const handleDeleteClick = (item: TypePembayaran) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (itemToDelete) {
      mutations.delete.mutate({ id: itemToDelete.id });
    }
  };

  const handleVerifyClick = (item: TypePembayaran) => {
    // Toggle status: Jika LUNAS -> BELUM_LUNAS, jika BELUM -> LUNAS
    const newStatus =
      item.statusBayar === StatusPembayaran.LUNAS
        ? StatusPembayaran.BELUM_LUNAS
        : StatusPembayaran.LUNAS;

    mutations.update.mutate({
      id: item.id,
      jumlahBayar: item.jumlahBayar, // Required by schema
      note: item.note ?? undefined, // Optional in schema
      statusBayar: newStatus,
      tanggalBayar:
        newStatus === StatusPembayaran.LUNAS
          ? new Date().toISOString()
          : undefined,
    });
  };

  const handleEditClick = (item: TypePembayaran) => {
    openDrawer("edit", item);
  };
  // --- TABLE CONFIG ---
  const tableColumns = columns({
    onEditClick: handleEditClick,
    onDeleteClick: handleDeleteClick,
    onVerifyClick: handleVerifyClick,
  });

  return (
    <div className="space-y-4">
      {/* --- TOOLBAR --- */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Data Pembayaran</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => refetch()}
            disabled={isLoading}
            title="Refresh Data"
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {/* Filter Status */}
          <Select
            value={statusFilter}
            onValueChange={(val) =>
              setStatusFilter(val as StatusPembayaran | "ALL")
            }
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Filter Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Status</SelectItem>
              <SelectItem value={StatusPembayaran.LUNAS}>Lunas</SelectItem>
              <SelectItem value={StatusPembayaran.BELUM_LUNAS}>
                Belum Lunas
              </SelectItem>
              <SelectItem value={StatusPembayaran.PENDING}>Pending</SelectItem>
            </SelectContent>
          </Select>

          {/* Tombol Tambah Manual (Opsional, nanti) */}
          {/* <Button>+ Tagihan Manual</Button> */}
        </div>
      </div>

      {/* --- DATA TABLE --- */}
      <DataTable
        columns={tableColumns}
        data={dataPembayaran ?? []}
        // Anda bisa tambahkan filterColumnId="namaMurid" jika ingin search bar nama di generic table
        // filterColumnId="namaMurid"
        // filterColumnPlaceholder="Cari nama murid..."
      />

      <EditPembayaran />

      {/* --- DIALOGS --- */}
      <DeleteConfirmationDialog
        isOpen={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Hapus Tagihan Pembayaran"
        description={
          <>
            Apakah Anda yakin ingin menghapus tagihan untuk{" "}
            <span className="text-foreground font-bold">
              {itemToDelete?.pendaftaranKelas.murid.namaLengkap}
            </span>{" "}
            sebesar{" "}
            <span className="text-foreground font-bold">
              {toRupiah(itemToDelete?.jumlahBayar ?? 0)}
            </span>
            ? Data ini tidak dapat dikembalikan dan dapat mempengaruhi saldo
            pertemuan siswa.
          </>
        }
        onConfirm={handleConfirmDelete}
        isLoading={mutations.delete.isPending}
        confirmText="Hapus Tagihan"
        cancelText="Batal"
      />
    </div>
  );
}
