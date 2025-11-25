"use client";
import { EditDrawer } from "@/app/_components/shared/edit-drawer";
import { Form } from "@/components/ui/form";
import { useAbsenGuruStore } from "@/store/useGuruStore";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import AbsenGuruForm from "../form/edit-absen-guru-form";
import {
  updateAbsensiGuruSchema,
  type TypeUpdateAbsensiGuruSchema,
} from "@/types/absenGuru.type";
import { useAbsenGuru } from "@/hooks/useAbsenGuru";

export default function EditVerifikasiAbsen() {
  const { isDrawerOpen, selectedAbsenGuru, closeDrawer, clearSelected } =
    useAbsenGuruStore();

  useEffect(() => {
    if (selectedAbsenGuru) {
      editAbsensiGuruForm.reset({
        guruId: selectedAbsenGuru.guruId,
        isVerified: selectedAbsenGuru.isVerified,
        status: selectedAbsenGuru.status,
      });
    }
  }, [selectedAbsenGuru]);

  const isOpen = isDrawerOpen("edit");

  const editAbsensiGuruForm = useForm<TypeUpdateAbsensiGuruSchema>({
    resolver: zodResolver(updateAbsensiGuruSchema),
    defaultValues: {
      guruId: selectedAbsenGuru?.guruId ?? "",
      isVerified: selectedAbsenGuru?.isVerified ?? false,
      status: selectedAbsenGuru?.status ?? "HADIR",
    },
  });

  const { mutations } = useAbsenGuru({
    onSuccessUpdate: () => {
      closeDrawer();
      clearSelected();
      editAbsensiGuruForm.reset();
    },
  });

  const handleSubmitEdit = async (data: TypeUpdateAbsensiGuruSchema) => {
    if (!selectedAbsenGuru) return;

    await mutations.update.mutateAsync({
      absensiId: selectedAbsenGuru.id,
      ...data,
    });
  };

  return (
    <EditDrawer
      isOpen={isOpen}
      onOpenChange={(open) => !open && closeDrawer()}
      title="Edit Absensi Guru"
      description="Ubah informasi absensi guru yang sudah ada"
      onSubmit={editAbsensiGuruForm.handleSubmit(handleSubmitEdit)}
      isPending={mutations.update.isPending}
      submitText="Simpan Perubahan"
      cancelText="Batal"
    >
      <Form {...editAbsensiGuruForm}>
        <AbsenGuruForm onSubmit={handleSubmitEdit} />
      </Form>
    </EditDrawer>
  );
}
