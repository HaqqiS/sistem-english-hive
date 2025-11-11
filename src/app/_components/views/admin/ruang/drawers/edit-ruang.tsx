"use client";
import { EditDrawer } from "@/app/_components/shared/edit-drawer";
import { Form } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useRuangStore } from "@/store/useCabangStore";
import {
  clientRuangSchema,
  type TypeClientRuangSchema,
} from "@/types/ruang.type";
import RuangForm from "../forms/ruang-form";
import { useRuang } from "@/hooks/useRuang";

export default function EditRuang() {
  const { isDrawerOpen, selectedRuang, closeDrawer, clearSelected } =
    useRuangStore();

  console.log(selectedRuang);

  useEffect(() => {
    if (selectedRuang) {
      editRuangForm.reset({
        namaRuang: selectedRuang.namaRuang,
        cabangId: selectedRuang.cabangId,
        isAktif: selectedRuang.isAktif,
      });
    }
  }, [selectedRuang]);

  const isOpen = isDrawerOpen("edit");

  const editRuangForm = useForm<TypeClientRuangSchema>({
    resolver: zodResolver(clientRuangSchema),
    defaultValues: {
      namaRuang: selectedRuang?.namaRuang,
      cabangId: selectedRuang?.cabangId,
      isAktif: selectedRuang?.isAktif,
    },
  });

  const { mutations } = useRuang({
    onSuccessUpdate: () => {
      closeDrawer();
      clearSelected();
      editRuangForm.reset();
    },
  });

  // const { mutateAsync: updateRuang, isPending: isUpdating } =
  //   api.ruang.updateRuang.useMutation({
  //     onSuccess: async () => {
  //       await apiUtils.ruang.getRuangByCabangId.invalidate();
  //       toast.success("Ruang berhasil diupdate");
  //       closeDrawer();
  //       clearSelected();
  //       editRuangForm.reset();
  //     },
  //     onError: (error) => {
  //       toast.error(`Gagal mengupdate ruang: ${error.message}`);
  //     },
  //   });

  const handleSubmitEdit = async (data: TypeClientRuangSchema) => {
    if (!selectedRuang) return;

    await mutations.update.mutateAsync({
      id: selectedRuang.id,
      ...data,
    });
  };

  return (
    <EditDrawer
      isOpen={isOpen}
      onOpenChange={(open) => !open && closeDrawer()}
      title="Edit Ruang"
      description="Ubah informasi ruang yang sudah ada"
      onSubmit={editRuangForm.handleSubmit(handleSubmitEdit)}
      isPending={mutations.update.isPending}
      submitText="Simpan Perubahan"
      cancelText="Batal"
    >
      <Form {...editRuangForm}>
        <RuangForm onSubmit={handleSubmitEdit} />
      </Form>
    </EditDrawer>
  );
}
