"use client";
import { EditDrawer } from "@/app/_components/shared/edit-drawer";
import { Form } from "@/components/ui/form";
import { api } from "@/trpc/react";
import {
  clientCabangSchema,
  type TypeClientCabangSchema,
} from "@/types/cabang.type";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import CabangForm from "../forms/cabang-form";
import { useCabangStore } from "@/store/useCabangStore";

export default function EditCabang() {
  const apiUtils = api.useUtils();

  const { isDrawerOpen, selectedCabang, closeDrawer, clearSelected } =
    useCabangStore();

  useEffect(() => {
    if (selectedCabang) {
      editCabangForm.reset({
        nama: selectedCabang.namaCabang,
        alamat: selectedCabang.alamat,
        noTelp: selectedCabang.noTelp,
      });
    }
  }, [selectedCabang]);

  const isOpen = isDrawerOpen("edit");

  const editCabangForm = useForm<TypeClientCabangSchema>({
    resolver: zodResolver(clientCabangSchema),
    defaultValues: {
      nama: selectedCabang?.namaCabang,
      alamat: selectedCabang?.alamat,
      noTelp: selectedCabang?.noTelp,
    },
  });

  const { mutateAsync: updateCabang, isPending: isUpdating } =
    api.cabang.updateCabang.useMutation({
      onSuccess: async () => {
        await apiUtils.cabang.getAll.invalidate();
        toast.success("Cabang berhasil diupdate");
        closeDrawer();
        clearSelected();
        editCabangForm.reset();
      },
      onError: (error) => {
        toast.error(`Gagal mengupdate cabang: ${error.message}`);
      },
    });

  const handleSubmitEdit = async (data: TypeClientCabangSchema) => {
    if (!selectedCabang) return;

    await updateCabang({
      id: selectedCabang.id,
      ...data,
    });
  };

  return (
    <EditDrawer
      isOpen={isOpen}
      onOpenChange={(open) => !open && closeDrawer()}
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
    </EditDrawer>
  );
}
