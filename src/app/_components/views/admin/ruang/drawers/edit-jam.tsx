"use client";
import { EditDrawer } from "@/app/_components/shared/edit-drawer";
import { Form } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useJamStore } from "@/store/useCabangStore";
import JamForm from "../forms/jam-form";
import { clientJamSchema, type TypeClientJamSchema } from "@/types/jam.type";
import { useJam } from "@/hooks/useJam";

export default function EditJam() {
  const { isDrawerOpen, selectedJam, closeDrawer, clearSelected } =
    useJamStore();

  console.log(selectedJam);

  useEffect(() => {
    if (selectedJam) {
      editJamForm.reset({
        cabangId: selectedJam.cabangId,
        jamMulai: selectedJam.jamMulai,
        jamSelesai: selectedJam.jamSelesai,
        namaSlot: selectedJam.namaSlot,
      });
    }
  }, [selectedJam]);

  const isOpen = isDrawerOpen("edit");

  const editJamForm = useForm<TypeClientJamSchema>({
    resolver: zodResolver(clientJamSchema),
    defaultValues: {
      cabangId: selectedJam?.cabangId,
      jamMulai: selectedJam?.jamMulai,
      jamSelesai: selectedJam?.jamSelesai,
      namaSlot: selectedJam?.namaSlot,
    },
  });

  const { mutations } = useJam({
    onSuccessUpdate: () => {
      closeDrawer();
      clearSelected();
      editJamForm.reset();
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

  const handleSubmitEdit = async (data: TypeClientJamSchema) => {
    if (!selectedJam) return;

    await mutations.update.mutateAsync({
      id: selectedJam.id,
      ...data,
    });
  };

  return (
    <EditDrawer
      isOpen={isOpen}
      onOpenChange={(open) => !open && closeDrawer()}
      title="Edit Ruang"
      description="Ubah informasi ruang yang sudah ada"
      onSubmit={editJamForm.handleSubmit(handleSubmitEdit)}
      isPending={mutations.update.isPending}
      submitText="Simpan Perubahan"
      cancelText="Batal"
    >
      <Form {...editJamForm}>
        <JamForm onSubmit={handleSubmitEdit} />
      </Form>
    </EditDrawer>
  );
}
