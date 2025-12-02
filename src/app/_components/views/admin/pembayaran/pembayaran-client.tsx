"use client";

import { useEffect, useState } from "react";
import { DataTable } from "@/app/_components/shared/data-table";
import { columns } from "./columns/columns-pembayaran";
import { StatusPembayaran } from "@prisma/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { RefreshCw, Search } from "lucide-react";
import { DeleteConfirmationDialog } from "@/app/_components/shared/delete-confirmation-dialog";
import {
  type TypePembayaran,
  type TypePembayaranPaginated,
} from "@/types/pembayaran.type";
import { toRupiah } from "@/utils/toRupiah";
import { usePembayaran } from "@/hooks/usePembayaran";
import { usePembayaranStore } from "@/store/usePembayaranStore";
import EditPembayaran from "./edit-pembayaran";
import type { PaginationState } from "@tanstack/react-table";
import TambahPembayaran from "./tambah-pembayara";
import { Input } from "@/components/ui/input";

interface PembayaranClientProps {
  initialDataPembayaran?: TypePembayaranPaginated;
}
export default function PembayaranClient({
  initialDataPembayaran,
}: PembayaranClientProps) {
  // --- STATE ---
  const [statusFilter, setStatusFilter] = useState<StatusPembayaran | "ALL">(
    "ALL",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const { openDrawer } = usePembayaranStore();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // State Delete
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<TypePembayaran | null>(null);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  // --- HOOKS/QUERIES/MUTATIONS ---
  const {
    dataGetAllPaginated: dataPembayaran,
    pageCount,
    isLoadingGetAllPaginated: isLoading,
    isFetchingGetAllPaginated: isFetching,
    refetchGetAllPaginated: refetch,
    isFetchingGetAllPaginated: isRefetching,
    mutations,
  } = usePembayaran({
    initialDataPaginated: initialDataPembayaran,
    statusFilter: statusFilter,
    searchFilter: debouncedSearch,
    enableGetAll: true,
    pagination: pagination,
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
        <div className="flex flex-col items-start gap-2">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0"
              onClick={() => refetch()}
              disabled={isLoading || isFetching}
              title="Refresh Data"
            >
              <RefreshCw
                className={`h-4 w-4 ${isLoading || isFetching ? "animate-spin" : ""}`}
              />
            </Button>
            <h2 className="text-lg font-semibold">Data Pembayaran</h2>
          </div>

          <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
            <div className="relative w-full sm:max-w-xs">
              <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
              <Input
                placeholder="Cari nama murid..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9"
              />
            </div>

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
                <SelectItem value={StatusPembayaran.PENDING}>
                  Pending
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Tombol Tambah Manual (Opsional, nanti) */}
            {/* <Button>+ Tagihan Manual</Button> */}
          </div>
        </div>

        <TambahPembayaran />
      </div>

      {/* --- DATA TABLE --- */}
      <DataTable
        columns={tableColumns}
        data={dataPembayaran ?? []}
        pageCount={pageCount}
        pagination={pagination}
        onPaginationChange={setPagination}
        isLoading={isLoading || isFetching}
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
