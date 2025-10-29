"use client";
import { api, type RouterOutputs } from "@/trpc/react";
import TambahCabang from "./tambah-cabang";
import { DataTable } from "../../_components/shared/data-table";
import { Input } from "@/app/_components/ui/input";
import { columns as createColumns } from "./columns";
import {
  type CabangType,
  type TypeClientCabangSchema,
  clientCabangSchema,
} from "@/types/cabang.type";
import { CabangEditDrawer } from "./cabang-drawer-edit";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/app/_components/ui/alert-dialog";
import { Button } from "@/app/_components/ui/button";

interface CabangClientProps {
  initialData: RouterOutputs["cabang"]["getAll"];
}

export default function CabangClient({ initialData }: CabangClientProps) {
  const [editFormCabangOpen, setEditFormCabangOpen] = useState(false);
  const [selectedCabangToEdit, setSelectedCabangToEdit] =
    useState<CabangType | null>(null);
  const [deleteCabangDialogOpen, setDeleteCabangDialogOpen] = useState(false);
  const [selectedCabangToDelete, setSelectedCabangToDelete] =
    useState<CabangType | null>(null);
  const [isPendingDelete, setIsPendingDelete] = useState(false);

  const editCabangForm = useForm<TypeClientCabangSchema>({
    resolver: zodResolver(clientCabangSchema),
  });

  const { data: dataCabang } = api.cabang.getAll.useQuery(undefined, {
    initialData: initialData,
    refetchOnWindowFocus: false,
  });

  const handleClickEditPemasukan = (item: CabangType) => {
    console.log("Edit clicked for Cabang ID:", item.id);
    setSelectedCabangToEdit(item);
    editCabangForm.reset({
      nama: item.namaCabang,
      alamat: item.alamat,
      noTelp: item.noTelp,
    });
    setEditFormCabangOpen(true);
    // Implement the edit logic here
  };

  const handleClickDeletePemasukan = (id: string) => {
    console.log("Delete clicked for Cabang ID:", id);
    setDeleteCabangDialogOpen(true);
    // Implement the delete logic here
  };

  const columns = createColumns({
    onEditClick: handleClickEditPemasukan,
    onDeleteClick: handleClickDeletePemasukan,
  });

  return (
    <>
      {selectedCabangToEdit && (
        <CabangEditDrawer
          isOpen={editFormCabangOpen}
          setIsOpen={setEditFormCabangOpen}
          form={editCabangForm}
          handleSubmitEditCabang={(data) => {
            console.log(data);
          }}
          isPending={false}
        />
      )}

      <AlertDialog
        open={deleteCabangDialogOpen}
        onOpenChange={setDeleteCabangDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Cabang</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogDescription>
            Yakin ingin menghapus Cabang{" "}
            <span className="text-accent-foreground font-bold">
              {selectedCabangToDelete?.namaCabang}{" "}
            </span>
            ini? Tindakan ini tidak dapat dibatalkan.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={() => {
                console.log(selectedCabangToDelete?.id);
              }}
              disabled={isPendingDelete}
            >
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="py-4">
        <TambahCabang />
      </div>

      <DataTable
        filterColumnId="namaCabang"
        filterColumnPlaceholder="Filter Nama Cabang..."
        columns={columns} // (columns dari 'columns.tsx')
        data={dataCabang}
        toolbar={(table) => (
          // Di sinilah Anda membangun toolbar custom Anda
          <div className="flex items-center gap-2">
            {/* Filter 1: Input Nama Cabang */}
            <Input
              placeholder="Filter Nama Cabang..."
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
            />

            {/* Filter 2: Select Level (CONTOH) */}
            {/* <Select
              onValueChange={(value) =>
                table.getColumn("level")?.setFilterValue(value)
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MIPA">MIPA</SelectItem>
                <SelectItem value="SOSIAL">SOSIAL</SelectItem>
              </SelectContent>
            </Select> */}
          </div>
        )}
      />
    </>
  );
}
