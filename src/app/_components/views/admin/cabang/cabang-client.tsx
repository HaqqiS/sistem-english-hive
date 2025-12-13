"use client";

import { useState } from "react";
import { DataTable as DataTableGeneric } from "@/app/_components/shared/data-table-generic";
import { DeleteConfirmationDialog } from "@/app/_components/shared/delete-confirmation-dialog";
import { columns as createCabangColumns } from "./cabang-columns";
import TambahCabang from "./tambah-cabang";
import { type CabangType } from "@/types/cabang.type";
import EditCabang from "./edit-cabang";
import { useCabangStore } from "@/store/useMasterDataStore";
import { useCabang } from "@/hooks/useCabang";
import { Tabs, TabsContent } from "@/components/ui/tabs";

export default function CabangClient() {
  // State management
  const { openDrawer: openCabangDrawer } = useCabangStore();

  const [deleteCabangDialogOpen, setDeleteCabangDialogOpen] = useState(false);
  const [selectedCabangToDelete, setSelectedCabangToDelete] =
    useState<CabangType | null>(null);

  const { data: dataCabang, mutations: cabangMutations } = useCabang({
    enableQuery: true,
    onSuccessDelete: () => {
      setDeleteCabangDialogOpen(false);
      setSelectedCabangToDelete(null);
    },
  });

  // Event handlers
  const handleEditClickCabang = (item: CabangType) => {
    openCabangDrawer("edit", item);
  };

  const handleDeleteClickCabang = (id: string) => {
    // const cabang = dataCabang.find((c) => c.id === id);
    const cabang = dataCabang?.find((c) => c.id === id);
    if (cabang) {
      setSelectedCabangToDelete(cabang);
      setDeleteCabangDialogOpen(true);
    }
  };

  const handleConfirmDeleteCabang = async () => {
    if (!selectedCabangToDelete) return;

    await cabangMutations.delete.mutateAsync({ id: selectedCabangToDelete.id });
  };

  // Create columns with handlers
  const columnsCabang = createCabangColumns({
    onEditClick: handleEditClickCabang,
    onDeleteClick: handleDeleteClickCabang,
  });

  return (
    <Tabs defaultValue="cabang">
      <TabsContent value="cabang">
        <div>
          <div className="flex items-center justify-between space-x-2 pt-4">
            <header className="flex items-center justify-between">
              <div>
                <h1 className="text-xl">List Cabang</h1>
                <p className="text-muted-foreground text-sm">
                  halaman ini mengatur data cabang.
                </p>
              </div>
            </header>

            <TambahCabang />

            <EditCabang />

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
              isLoading={cabangMutations.delete.isPending}
              confirmText="Hapus"
              cancelText="Batal"
            />
          </div>

          <DataTableGeneric columns={columnsCabang} data={dataCabang ?? []} />
        </div>
      </TabsContent>
    </Tabs>
  );
}
