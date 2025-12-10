"use client";

import { useState } from "react";
import { DataTable as DataTableGeneric } from "@/app/_components/shared/data-table-generic";
import { DeleteConfirmationDialog } from "@/app/_components/shared/delete-confirmation-dialog";
import { columns as createCabangColumns } from "./columns/cabang-columns";
import { columns as createRuangColumns } from "./columns/ruang-columns";
import { columns as createJamTetapColumns } from "./columns/jam-tetap-columns";
import { columns as createJamCustomColumns } from "./columns/jam-custom-columns";
import TambahCabang from "./drawers/tambah-cabang";
import { type CabangType } from "@/types/cabang.type";
import TambahRuang from "./drawers/tambah-ruang";
import EditCabang from "./drawers/edit-cabang";
import {
  useCabangStore,
  useJamCustomStore,
  useJamTetapStore,
  useRuangStore,
} from "@/store/useCabangStore";
import type { RuangType } from "@/types/ruang.type";
import EditRuang from "./drawers/edit-ruang";
import { useCabang } from "@/hooks/useCabang";
import { useRuang } from "@/hooks/useRuang";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { TypeJamTetap, TypeJamCustom } from "@/types/jam.type";
import { useJam } from "@/hooks/useJam";
import TambahJamTetap from "./drawers/tambah-jam-tetap";
import EditJamTetap from "./drawers/edit-jam-tetap";
import TambahJamCustom from "./drawers/tambah-jam-custom";
import EditJamCustom from "./drawers/edit-jam-custom";
import { useGlobalCabangStore } from "@/store/useGlobalCabangStore";

export default function RuangClient() {
  // State management
  const { activeCabangId } = useGlobalCabangStore();

  const { openDrawer: openCabangDrawer } = useCabangStore();
  const { openDrawer: openRuangDrawer } = useRuangStore();
  const { openDrawer: openJamTetapDrawer } = useJamTetapStore();
  const { openDrawer: openJamCustomDrawer } = useJamCustomStore();

  const [deleteCabangDialogOpen, setDeleteCabangDialogOpen] = useState(false);
  const [selectedCabangToDelete, setSelectedCabangToDelete] =
    useState<CabangType | null>(null);

  const [deleteRuangDialogOpen, setDeleteRuangDialogOpen] = useState(false);
  const [selectedRuangToDelete, setSelectedRuangToDelete] =
    useState<RuangType | null>(null);

  const [deleteJamTetapDialogOpen, setDeleteJamTetapDialogOpen] =
    useState(false);
  const [selectedJamTetapToDelete, setSelectedJamTetapToDelete] =
    useState<TypeJamTetap | null>(null);

  const [deleteJamCustomDialogOpen, setDeleteJamCustomDialogOpen] =
    useState(false);
  const [selectedJamCustomToDelete, setSelectedJamCustomToDelete] =
    useState<TypeJamCustom | null>(null);

  const { data: dataCabang, mutations: cabangMutations } = useCabang({
    // initialData: initialDataCabang,
    onSuccessDelete: () => {
      setDeleteCabangDialogOpen(false);
      setSelectedCabangToDelete(null);
    },
  });
  const { data: dataRuang, mutations: ruangMutations } = useRuang({
    filterCabang: activeCabangId,
    onSuccessDelete: () => {
      setDeleteRuangDialogOpen(false);
      setSelectedRuangToDelete(null);
    },
  });
  const { dataJamTetap, tetapMutations } = useJam({
    filterCabang: activeCabangId,
    // initialDataJamTetap,
    onSuccessDelete: () => {
      setDeleteJamTetapDialogOpen(false);
      setSelectedJamTetapToDelete(null);
    },
  });

  const { dataJamCustom, customMutations } = useJam({
    filterCabang: activeCabangId,
    // initialDataJamCustom,
    onSuccessDelete: () => {
      setDeleteJamCustomDialogOpen(false);
      setSelectedJamCustomToDelete(null);
    },
  });

  // Event handlers
  const handleEditClickCabang = (item: CabangType) => {
    openCabangDrawer("edit", item);
  };

  const handleEditClickRuang = (item: RuangType) => {
    openRuangDrawer("edit", item);
  };

  const handleEditClickJamTetap = (item: TypeJamTetap) => {
    openJamTetapDrawer("edit", item);
    console.log(item);
  };

  const handleEditClickJamCustom = (item: TypeJamCustom) => {
    openJamCustomDrawer("edit", item);
    console.log(item);
  };

  const handleDeleteClickCabang = (id: string) => {
    // const cabang = dataCabang.find((c) => c.id === id);
    const cabang = dataCabang?.find((c) => c.id === id);
    if (cabang) {
      setSelectedCabangToDelete(cabang);
      setDeleteCabangDialogOpen(true);
    }
  };
  const handleDeleteClickRuang = (id: string) => {
    const ruang = dataRuang?.find((r) => r.id === id);
    if (ruang) {
      setSelectedRuangToDelete(ruang);
      setDeleteRuangDialogOpen(true);
    }
  };

  const handleDeleteClickJamTetap = (id: string) => {
    const jam = dataJamTetap?.find((j) => j.id === id);
    if (jam) {
      setSelectedJamTetapToDelete(jam);
      setDeleteJamTetapDialogOpen(true);
    }
  };

  const handleDeleteClickJamCustom = (id: string) => {
    const jam = dataJamCustom?.find((j) => j.id === id);
    if (jam) {
      setSelectedJamCustomToDelete(jam);
      setDeleteJamCustomDialogOpen(true);
    }
  };

  const handleConfirmDeleteCabang = async () => {
    if (!selectedCabangToDelete) return;

    await cabangMutations.delete.mutateAsync({ id: selectedCabangToDelete.id });
  };
  const handleConfirmDeleteRuang = async () => {
    if (!selectedRuangToDelete) return;

    await ruangMutations.delete.mutateAsync({ id: selectedRuangToDelete.id });
  };
  const handleConfirmDeleteJamTetap = async () => {
    if (!selectedJamTetapToDelete) return;

    await tetapMutations.delete.mutateAsync({
      id: selectedJamTetapToDelete.id,
    });
  };
  const handleConfirmDeleteJamCustom = async () => {
    if (!selectedJamCustomToDelete) return;

    await customMutations.delete.mutateAsync({
      id: selectedJamCustomToDelete.id,
    });
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
  const columnsJamTetap = createJamTetapColumns({
    onEditClick: handleEditClickJamTetap,
    onDeleteClick: handleDeleteClickJamTetap,
  });

  const columnsJamCustom = createJamCustomColumns({
    onEditClick: handleEditClickJamCustom,
    onDeleteClick: handleDeleteClickJamCustom,
  });

  return (
    <Tabs defaultValue="ruang">
      <TabsList>
        <TabsTrigger value="ruang">Kelola Ruang</TabsTrigger>
        <TabsTrigger value="cabang">Kelola Cabang</TabsTrigger>
        <TabsTrigger value="jamReg">Kelola Jam Reguler</TabsTrigger>
        <TabsTrigger value="jamPriv">Kelola Jam Private</TabsTrigger>
      </TabsList>
      <TabsContent value="ruang">
        <div>
          <div className="flex items-center justify-between space-x-2 pt-4">
            <header className="flex items-center justify-between">
              <div>
                <h1 className="text-xl">List Ruang</h1>
                <p className="text-muted-foreground text-sm">
                  halaman ini mengatur data ruang.
                </p>
              </div>
            </header>

            <TambahRuang />
            <EditRuang />
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
              isLoading={ruangMutations.delete.isPending}
              confirmText="Hapus"
              cancelText="Batal"
            />
          </div>

          <DataTableGeneric
            // filterColumnId="namaRuang"
            // filterColumnPlaceholder="Filter Nama Ruang..."
            columns={columnsRuang}
            data={dataRuang ?? []}
          // toolbar={(table) => (
          //   <div className="flex items-center gap-2">
          //     {/* <Select
          //   onValueChange={(value) =>
          //     table.getColumn("cabangId")?.setFilterValue(value)
          //   }
          // >
          //   <SelectTrigger className="w-[180px]">
          //     <SelectValue placeholder="Filter by Cabang" />
          //   </SelectTrigger>
          //   <SelectContent>
          //     <SelectItem value="all">All</SelectItem>
          //     {dataCabang?.map((cabang) => {
          //       return (
          //         <SelectItem key={cabang.id} value={cabang.id}>
          //           {cabang.namaCabang}
          //         </SelectItem>
          //       );
          //     })}
          //   </SelectContent>
          // </Select> */}
          //   </div>
          // )}
          />
        </div>
      </TabsContent>
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
      <TabsContent value="jamReg">
        <div>
          <div className="flex items-center justify-between space-x-2 pt-4">
            <header className="flex items-center justify-between">
              <div>
                <h1 className="text-xl">List Jam Pertemuan Reguler</h1>
                <p className="text-muted-foreground text-sm">
                  halaman ini mengatur data waktu pertemuan.
                </p>
              </div>
            </header>

            <TambahJamTetap />
            <EditJamTetap />
            <DeleteConfirmationDialog
              isOpen={deleteJamTetapDialogOpen}
              onOpenChange={setDeleteJamTetapDialogOpen}
              title="Hapus Jam"
              description={
                <>
                  Yakin ingin menghapus{" "}
                  <span className="text-accent font-bold">
                    {selectedJamTetapToDelete?.namaSlot}
                  </span>
                  ? Tindakan ini tidak dapat dibatalkan.
                </>
              }
              onConfirm={handleConfirmDeleteJamTetap}
              isLoading={tetapMutations.delete.isPending}
              confirmText="Hapus"
              cancelText="Batal"
            />
          </div>

          <DataTableGeneric
            data={dataJamTetap ?? []}
            columns={columnsJamTetap}
          />
        </div>
      </TabsContent>

      <TabsContent value="jamPriv">
        <div>
          <div className="flex items-center justify-between space-x-2 pt-4">
            <header className="flex items-center justify-between">
              <div>
                <h1 className="text-xl">List Jam Pertemuan Private</h1>
                <p className="text-muted-foreground text-sm">
                  halaman ini mengatur data waktu pertemuan.
                </p>
              </div>
            </header>

            <TambahJamCustom />
            <EditJamCustom />
            <DeleteConfirmationDialog
              isOpen={deleteJamCustomDialogOpen}
              onOpenChange={setDeleteJamCustomDialogOpen}
              title="Hapus Jam"
              description={
                <>
                  Yakin ingin menghapus
                  <span className="text-accent font-bold"></span>? Tindakan ini
                  tidak dapat dibatalkan.
                </>
              }
              onConfirm={handleConfirmDeleteJamCustom}
              isLoading={customMutations.delete.isPending}
              confirmText="Hapus"
              cancelText="Batal"
            />
          </div>

          <DataTableGeneric
            data={dataJamCustom ?? []}
            columns={columnsJamCustom}
          />
        </div>
      </TabsContent>
    </Tabs>
  );
}
