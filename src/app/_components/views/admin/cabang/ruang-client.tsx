"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { api, type RouterOutputs } from "@/trpc/react";
import { DataTable } from "@/app/_components/shared/data-table";
import { Input } from "@/components/ui/input";
import { DeleteConfirmationDialog } from "@/app/_components/shared/delete-confirmation-dialog";
import { columns as createColumns } from "./ruang-columns";
import TambahCabang from "./tambah-cabang";
import {
  type RuangType,
  type TypeClientRuangSchema,
  clientRuangSchema,
} from "@/types/ruang.type";
import { toast } from "sonner";
import { EditDrawer } from "@/app/_components/shared/edit-drawer";
import { Form } from "@/components/ui/form";
import CabangForm from "./cabang-form";
import { keepPreviousData } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface RuangClientProps {
  initialData: RouterOutputs["ruang"]["getRuangByCabangId"];
}

export default function RuangClient({ initialData }: RuangClientProps) {
  // const apiUtils = api.useUtils();
  // State management
  const [selectedCabangId, setSelectedCabangId] = useState<string | null>(null);
  // const [editFormCabangOpen, setEditFormCabangOpen] = useState(false);
  // const [selectedCabangToEdit, setSelectedCabangToEdit] =
  //   useState<CabangType | null>(null);
  // const [deleteCabangDialogOpen, setDeleteCabangDialogOpen] = useState(false);
  // const [selectedCabangToDelete, setSelectedCabangToDelete] =
  //   useState<CabangType | null>(null);

  // Form setup
  // const editCabangForm = useForm<TypeClientCabangSchema>({
  //   resolver: zodResolver(clientCabangSchema),
  // });

  // API queries
  // const { data: dataCabang } = api.cabang.getAll.useQuery(undefined, {
  //   initialData: initialData,
  //   refetchOnWindowFocus: false,
  // });
  const { data: dataRuang } = api.ruang.getRuangByCabangId.useQuery(
    {
      cabangId: selectedCabangId, // 4. Gunakan state di sini
    },
    {
      initialData: initialData,
      placeholderData: keepPreviousData,
    },
  );

  const { data: dataCabang } = api.cabang.getAll.useQuery(undefined, {
    initialData: [],
    placeholderData: keepPreviousData,
  });

  // Mutation for delete
  // const { mutateAsync: deleteCabang, isPending: isDeleting } =
  //   api.cabang.deleteCabang.useMutation({
  //     onSuccess: async () => {
  //       await apiUtils.cabang.getAll.invalidate();
  //       toast.success("Cabang berhasil dihapus");
  //       setDeleteCabangDialogOpen(false);
  //       setSelectedCabangToDelete(null);
  //     },
  //     onError: (error) => {
  //       toast.error(`Gagal menghapus cabang: ${error.message}`);
  //     },
  //   });

  // Mutation for update
  // const { mutateAsync: updateCabang, isPending: isUpdating } =
  //   api.cabang.updateCabang.useMutation({
  //     onSuccess: async () => {
  //       await apiUtils.cabang.getAll.invalidate();
  //       toast.success("Cabang berhasil diupdate");
  //       setEditFormCabangOpen(false);
  //       setSelectedCabangToEdit(null);
  //       editCabangForm.reset();
  //     },
  //     onError: (error) => {
  //       toast.error(`Gagal mengupdate cabang: ${error.message}`);
  //     },
  //   });

  // Event handlers
  const handleEditClick = (item: RuangType) => {
    console.log(item);
    // setSelectedCabangToEdit(item);
    // editCabangForm.reset({
    //   nama: item.namaCabang,
    //   alamat: item.alamat,
    //   noTelp: item.noTelp,
    // });
    // setEditFormCabangOpen(true);
  };

  const handleDeleteClick = (id: string, nama: string) => {
    console.log({ id, nama });
    // const cabang = dataCabang.find((c) => c.id === id);
    // const cabang = initialData.find((c) => c.id === id);
    // if (cabang) {
    //   setSelectedCabangToDelete(cabang);
    //   setDeleteCabangDialogOpen(true);
    // }
  };

  // const handleConfirmDelete = async () => {
  //   if (!selectedCabangToDelete) return;

  //   await deleteCabang({ id: selectedCabangToDelete.id });
  // };

  // const handleSubmitEdit = async (data: TypeClientCabangSchema) => {
  //   if (!selectedCabangToEdit) return;

  //   await updateCabang({
  //     id: selectedCabangToEdit.id,
  //     ...data,
  //   });
  // };

  // Create columns with handlers
  const columns = createColumns({
    onEditClick: handleEditClick,
    onDeleteClick: handleDeleteClick,
  });

  return (
    <div className="space-y-4">
      {/* Edit Drawer */}
      {/* Edit Drawer - Now using reusable component */}
      {/* <EditDrawer
        isOpen={editFormCabangOpen}
        onOpenChange={setEditFormCabangOpen}
        title="Edit Cabang"
        description="Ubah informasi cabang yang sudah ada"
        onSubmit={editCabangForm.handleSubmit(handleSubmitEdit)}
        isPending={isUpdating}
        submitText="Simpan Perubahan"
        cancelText="Batal"
      >
        <Form {...editCabangForm}>
          <CabangForm onSubmit={handleSubmitEdit} />
        </Form>
      </EditDrawer> */}

      {/* Delete Confirmation Dialog */}
      {/* <DeleteConfirmationDialog
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
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        confirmText="Hapus"
        cancelText="Batal"
      /> */}

      {/* Add Branch Button */}
      {/* <div className="flex justify-end">
        <TambahCabang />
      </div> */}

      {/* Data Table */}
      <DataTable
        filterColumnId="namaRuang"
        filterColumnPlaceholder="Filter Nama Ruang..."
        columns={columns}
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
    </div>
  );
}
