"use client";

import { useState } from "react";
import { api, type RouterOutputs } from "@/trpc/react";
import { DataTable } from "@/app/_components/shared/data-table";
import { DeleteConfirmationDialog } from "@/app/_components/shared/delete-confirmation-dialog";
import { columns as createCabangColumns } from "./columns/cabang-columns";
import { columns as createRuangColumns } from "./columns/ruang-columns";
import TambahCabang from "./drawers/tambah-cabang";
import { type CabangType } from "@/types/cabang.type";
import { keepPreviousData } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import TambahRuang from "./drawers/tambah-ruang";
import EditCabang from "./drawers/edit-cabang";
import { useCabangStore, useRuangStore } from "@/store/useCabangStore";
import type { RuangType } from "@/types/ruang.type";
import EditRuang from "./drawers/edit-ruang";
import { toast } from "sonner";

interface CabangClientProps {
  initialDataCabang: RouterOutputs["cabang"]["getAll"];
  initialDataRuang: RouterOutputs["ruang"]["getRuangByCabangId"];
}

export default function CabangClient({
  initialDataCabang,
  initialDataRuang,
}: CabangClientProps) {
  const apiUtils = api.useUtils();
  // State management
  const { openDrawer: openCabangDrawer } = useCabangStore();
  const { openDrawer: openRuangDrawer } = useRuangStore();

  const [deleteCabangDialogOpen, setDeleteCabangDialogOpen] = useState(false);
  const [selectedCabangToDelete, setSelectedCabangToDelete] =
    useState<CabangType | null>(null);

  const [deleteRuangDialogOpen, setDeleteRuangDialogOpen] = useState(false);
  const [selectedRuangToDelete, setSelectedRuangToDelete] =
    useState<RuangType | null>(null);

  const [selectedCabangId, setSelectedCabangId] = useState<string>("all");

  // Form setup

  // API queries
  // const { data: dataCabang } = api.cabang.getAll.useQuery(undefined, {
  //   initialData: initialData,
  //   refetchOnWindowFocus: false,
  // });
  const { data: dataCabang } = api.cabang.getAll.useQuery(undefined, {
    initialData: initialDataCabang,
    placeholderData: keepPreviousData,
  });

  const { data: dataRuang } = api.ruang.getRuangByCabangId.useQuery(
    { cabangId: selectedCabangId },
    { initialData: initialDataRuang },
  );

  // Mutation for delete
  const { mutateAsync: deleteCabang, isPending: isDeletingCabang } =
    api.cabang.deleteCabang.useMutation({
      onSuccess: async () => {
        await apiUtils.cabang.getAll.invalidate();
        toast.success("Cabang berhasil dihapus");
        setDeleteCabangDialogOpen(false);
        setSelectedCabangToDelete(null);
      },
      onError: (error) => {
        toast.error(`Gagal menghapus cabang: ${error.message}`);
      },
    });

  const { mutateAsync: deleteRuang, isPending: isDeletingRuang } =
    api.ruang.deleteRuang.useMutation({
      onSuccess: async () => {
        await apiUtils.ruang.getRuangByCabangId.invalidate();
        toast.success("Ruang berhasil dihapus");
        setDeleteRuangDialogOpen(false);
        setSelectedRuangToDelete(null);
      },
      onError: (error) => {
        toast.error(`Gagal menghapus ruang: ${error.message}`);
      },
    });

  // Event handlers
  const handleEditClickCabang = (item: CabangType) => {
    openCabangDrawer("edit", item);
  };

  const handleEditClickRuang = (item: RuangType) => {
    openRuangDrawer("edit", item);
  };

  const handleDeleteClickCabang = (id: string, nama: string) => {
    // const cabang = dataCabang.find((c) => c.id === id);
    const cabang = initialDataCabang.find((c) => c.id === id);
    if (cabang) {
      setSelectedCabangToDelete(cabang);
      setDeleteCabangDialogOpen(true);
    }
  };
  const handleDeleteClickRuang = (id: string, nama: string) => {
    const ruang = initialDataRuang.find((r) => r.id === id);
    if (ruang) {
      setSelectedRuangToDelete(ruang);
      setDeleteRuangDialogOpen(true);
    }
  };

  const handleConfirmDeleteCabang = async () => {
    if (!selectedCabangToDelete) return;

    await deleteCabang({ id: selectedCabangToDelete.id });
  };
  const handleConfirmDeleteRuang = async () => {
    if (!selectedRuangToDelete) return;

    await deleteRuang({ id: selectedRuangToDelete.id });
  };

  // Create columns with handlers
  const columnsCabang = createCabangColumns({
    onEditClick: handleEditClickCabang,
    onDeleteClick: handleDeleteClickCabang,
  });

  const columnsRuang = createRuangColumns({
    onEditClick: handleEditClickRuang,
    onDeleteClick: handleDeleteClickRuang,
  });

  return (
    <div className="space-y-4">
      <EditCabang />
      <EditRuang />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        isOpen={deleteCabangDialogOpen}
        onOpenChange={setDeleteCabangDialogOpen}
        title="Hapus Cabang"
        description={
          <>
            Yakin ingin menghapus cabang{" "}
            <span className="text-accent font-bold">
              {selectedCabangToDelete?.namaCabang}
            </span>
            ? Tindakan ini tidak dapat dibatalkan.
          </>
        }
        onConfirm={handleConfirmDeleteCabang}
        isLoading={isDeletingCabang}
        confirmText="Hapus"
        cancelText="Batal"
      />

      <DeleteConfirmationDialog
        isOpen={deleteRuangDialogOpen}
        onOpenChange={setDeleteRuangDialogOpen}
        title="Hapus Ruang"
        description={
          <>
            Yakin ingin menghapus ruang{" "}
            <span className="text-accent font-bold">
              {selectedRuangToDelete?.namaRuang}
            </span>
            ? Tindakan ini tidak dapat dibatalkan.
          </>
        }
        onConfirm={handleConfirmDeleteRuang}
        isLoading={isDeletingRuang}
        confirmText="Hapus"
        cancelText="Batal"
      />

      {/* Add Branch Button */}
      <div className="flex space-x-2">
        <TambahRuang />
        <TambahCabang />
      </div>

      {/* Data Table */}

      <DataTable
        filterColumnId="namaRuang"
        filterColumnPlaceholder="Filter Nama Ruang..."
        columns={columnsRuang}
        data={dataRuang ?? []}
        toolbar={(table) => (
          <div className="flex items-center gap-2">
            <Select
              onValueChange={(value) =>
                table.getColumn("cabangId")?.setFilterValue(value)
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by Cabang" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {dataCabang?.map((cabang) => {
                  return (
                    <SelectItem key={cabang.id} value={cabang.id}>
                      {cabang.namaCabang}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        )}
      />

      <DataTable
        filterColumnId="namaCabang"
        filterColumnPlaceholder="Filter Nama Cabang..."
        columns={columnsCabang}
        data={dataCabang ?? []}
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
