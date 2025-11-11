"use client";

import { useState } from "react";
import { type RouterOutputs } from "@/trpc/react";
import { DataTable } from "@/app/_components/shared/data-table";
import { DeleteConfirmationDialog } from "@/app/_components/shared/delete-confirmation-dialog";
import { columns as createCabangColumns } from "./columns/cabang-columns";
import { columns as createRuangColumns } from "./columns/ruang-columns";
import { columns as createJamColumns } from "./columns/jam-columns";
import TambahCabang from "./drawers/tambah-cabang";
import { type CabangType } from "@/types/cabang.type";
import { keepPreviousData } from "@tanstack/react-query";
import TambahRuang from "./drawers/tambah-ruang";
import EditCabang from "./drawers/edit-cabang";
import {
  useCabangStore,
  useJamStore,
  useRuangStore,
} from "@/store/useCabangStore";
import type { RuangType } from "@/types/ruang.type";
import EditRuang from "./drawers/edit-ruang";
import { useCabang } from "@/hooks/useCabang";
import { useRuang } from "@/hooks/useRuang";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TambahJam from "./drawers/tambah-jam";
import type { TypeJam } from "@/types/jam.type";
import { useJam } from "@/hooks/useJam";
import EditJam from "./drawers/edit-jam";

interface RuangClientProps {
  initialDataCabang: RouterOutputs["cabang"]["getAll"];
  initialDataRuang: RouterOutputs["ruang"]["getRuangByCabangId"];
  initialDataJam: TypeJam[];
}

export default function RuangClient({
  initialDataCabang,
  initialDataRuang,
  initialDataJam,
}: RuangClientProps) {
  // State management
  const { openDrawer: openCabangDrawer } = useCabangStore();
  const { openDrawer: openRuangDrawer } = useRuangStore();
  const { openDrawer: openJamDrawer } = useJamStore();

  const [deleteCabangDialogOpen, setDeleteCabangDialogOpen] = useState(false);
  const [selectedCabangToDelete, setSelectedCabangToDelete] =
    useState<CabangType | null>(null);

  const [deleteRuangDialogOpen, setDeleteRuangDialogOpen] = useState(false);
  const [selectedRuangToDelete, setSelectedRuangToDelete] =
    useState<RuangType | null>(null);

  const [deleteJamDialogOpen, setDeleteJamDialogOpen] = useState(false);
  const [selectedJamToDelete, setSelectedJamToDelete] =
    useState<TypeJam | null>(null);

  // Form setup

  // API queries
  // const { data: dataCabang } = api.cabang.getAll.useQuery(undefined, {
  //   initialData: initialData,
  //   refetchOnWindowFocus: false,
  // });
  // const { data: dataCabang } = api.cabang.getAll.useQuery(undefined, {
  //   initialData: initialDataCabang,
  //   placeholderData: keepPreviousData,
  // });

  // const { data: dataRuang } = api.ruang.getRuangByCabangId.useQuery(
  //   { cabangId: selectedCabangId },
  //   { initialData: initialDataRuang },
  // );

  const { data: dataCabang, mutations: cabangMutations } = useCabang({
    initialData: initialDataCabang,
    onSuccessDelete: () => {
      setDeleteCabangDialogOpen(false);
      setSelectedCabangToDelete(null);
    },
  });
  const { data: dataRuang, mutations: ruangMutations } = useRuang({
    initialData: initialDataRuang,
    onSuccessDelete: () => {
      setDeleteRuangDialogOpen(false);
      setSelectedRuangToDelete(null);
    },
  });
  const { dataJam, mutations: jamMutations } = useJam({
    initialData: initialDataJam,
    onSuccessDelete: () => {
      setDeleteJamDialogOpen(false);
      setSelectedJamToDelete(null);
    },
  });

  // Event handlers
  const handleEditClickCabang = (item: CabangType) => {
    openCabangDrawer("edit", item);
  };

  const handleEditClickRuang = (item: RuangType) => {
    openRuangDrawer("edit", item);
  };

  const handleEditClickJam = (item: TypeJam) => {
    openJamDrawer("edit", item);
    console.log(item);
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

  const handleDeleteClickJam = (id: string, nama: string) => {
    const jam = initialDataJam.find((j) => j.id === id);
    if (jam) {
      setSelectedJamToDelete(jam);
      setDeleteJamDialogOpen(true);
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
  const handleConfirmDeleteJam = async () => {
    if (!selectedJamToDelete) return;

    await jamMutations.delete.mutateAsync({ id: selectedJamToDelete.id });
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
  const columnsJam = createJamColumns({
    onEditClick: handleEditClickJam,
    onDeleteClick: handleDeleteClickJam,
  });

  return (
    <Tabs defaultValue="ruang">
      <TabsList>
        <TabsTrigger value="ruang">Kelola Ruang</TabsTrigger>
        <TabsTrigger value="cabang">Kelola Cabang</TabsTrigger>
        <TabsTrigger value="jam">Kelola Jam Pertemuan</TabsTrigger>
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

          <DataTable
            filterColumnId="namaRuang"
            filterColumnPlaceholder="Filter Nama Ruang..."
            columns={columnsRuang}
            data={dataRuang ?? []}
            toolbar={(table) => (
              <div className="flex items-center gap-2">
                {/* <Select
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
            </Select> */}
              </div>
            )}
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
      </TabsContent>
      <TabsContent value="jam">
        <div>
          <div className="flex items-center justify-between space-x-2 pt-4">
            <header className="flex items-center justify-between">
              <div>
                <h1 className="text-xl">List Jam Pertemuan</h1>
                <p className="text-muted-foreground text-sm">
                  halaman ini mengatur data waktu pertemuan.
                </p>
              </div>
            </header>

            <TambahJam />
            <EditJam />
            <DeleteConfirmationDialog
              isOpen={deleteJamDialogOpen}
              onOpenChange={setDeleteJamDialogOpen}
              title="Hapus Jam"
              description={
                <>
                  Yakin ingin menghapus{" "}
                  <span className="text-accent font-bold">
                    {selectedJamToDelete?.namaSlot}
                  </span>
                  ? Tindakan ini tidak dapat dibatalkan.
                </>
              }
              onConfirm={handleConfirmDeleteJam}
              isLoading={jamMutations.delete.isPending}
              confirmText="Hapus"
              cancelText="Batal"
            />
          </div>

          <DataTable data={dataJam ?? []} columns={columnsJam} />
        </div>
      </TabsContent>
    </Tabs>
  );
}
