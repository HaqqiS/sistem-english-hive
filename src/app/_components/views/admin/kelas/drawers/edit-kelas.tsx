"use client";
import { EditDrawer } from "@/app/_components/shared/edit-drawer";
import { Form } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  clientKelasSchema,
  type TypeClientKelasSchema,
} from "@/types/kelas.type";
import { useKelasStore } from "@/store/useKelasStore";
import { useKelas } from "@/hooks/useKelas";
import KelasForm from "../forms/kelas-form";

export default function EditKelas() {
  const { isDrawerOpen, selectedKelas, closeDrawer, clearSelected } =
    useKelasStore();

  const editKelasForm = useForm<TypeClientKelasSchema>({
    resolver: zodResolver(clientKelasSchema),
    defaultValues: {
      jenisKelas: selectedKelas?.jenisKelas,
      level: selectedKelas?.level,
      tipe: selectedKelas?.tipe,
      grup: selectedKelas?.grup ?? "",
      bulanTahunAjar: selectedKelas?.bulanTahunAjar,
      deskripsi: selectedKelas?.deskripsi ?? "",
      hargaKelas: selectedKelas?.hargaKelas,
      kodeKelas: selectedKelas?.kodeKelas,
    },
  });

  useEffect(() => {
    if (selectedKelas) {
      editKelasForm.reset({
        jenisKelas: selectedKelas.jenisKelas,
        level: selectedKelas.level,
        tipe: selectedKelas.tipe,
        grup: selectedKelas.grup ?? "",
        bulanTahunAjar: selectedKelas.bulanTahunAjar,
        deskripsi: selectedKelas.deskripsi ?? "",
        hargaKelas: selectedKelas.hargaKelas,
        kodeKelas: selectedKelas.kodeKelas,
      });
    }
  }, [selectedKelas, editKelasForm]);

  const isOpen = isDrawerOpen("edit");

  const { mutations } = useKelas({
    onSuccessUpdate: () => {
      closeDrawer();
      // clearSelected();
      editKelasForm.reset();
    },
  });

  const handleSubmitEdit = async (data: TypeClientKelasSchema) => {
    if (!selectedKelas) return;

    await mutations.update.mutateAsync({
      id: selectedKelas.id,
      ...data,
    });
  };

  return (
    <EditDrawer
      isOpen={isOpen}
      onOpenChange={(open) => !open && closeDrawer()}
      title="Edit Kelas"
      description="Ubah informasi kelas yang sudah ada"
      onSubmit={editKelasForm.handleSubmit(handleSubmitEdit)}
      isPending={mutations.update.isPending}
      submitText="Simpan Perubahan"
      cancelText="Batal"
    >
      <Form {...editKelasForm}>
        <KelasForm onSubmit={handleSubmitEdit} />
      </Form>
    </EditDrawer>
  );
}
