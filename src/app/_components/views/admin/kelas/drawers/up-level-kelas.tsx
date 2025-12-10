"use client";

import { EditDrawer } from "@/app/_components/shared/edit-drawer"; // Using EditDrawer for better UX consistency
import { Form } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  type TypeUpLevelKelasSchema,
  upLevelKelasSchema,
} from "@/types/kelas.type";
import { useKelas } from "@/hooks/useKelas";
import UpLevelKelasForm from "../forms/up-level-kelas-form";
import { useKelasStore } from "@/store/useKelasStore";

export default function UpLevelKelas() {
  const { isDrawerOpen, selectedKelas, closeDrawer, clearSelected } =
    useKelasStore();

  const isOpen = isDrawerOpen("upLevel");

  const form = useForm<TypeUpLevelKelasSchema>({
    resolver: zodResolver(upLevelKelasSchema),
    values: selectedKelas
      ? {
        oldKelasId: selectedKelas.id,
        // Auto-increment level
        newLevel: selectedKelas.level + 1,
        newBulanTahunAjar: "",
        newKodeKelas: "",
        newTanggalMulai: "",
        hargaKelas: selectedKelas.hargaKelas,
      }
      : undefined,
    defaultValues: {
      oldKelasId: "",
      newLevel: undefined,
      newBulanTahunAjar: "",
      newKodeKelas: "",
      newTanggalMulai: "",
      hargaKelas: 0,
    },
  });

  const { mutations: kelasMutations } = useKelas({
    onSuccessUpLevel: () => {
      // Custom callback name for clarity
      closeDrawer();
      clearSelected();
      form.reset();
    },
  });

  const onSubmit = (values: TypeUpLevelKelasSchema) => {
    kelasMutations.upLevel.mutate(values);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      closeDrawer();
      clearSelected();
      form.reset();
    }
  };

  if (!selectedKelas) return null;

  return (
    <EditDrawer
      title="Naik Kelas (Up Level)"
      description={`Proses ini akan membuat kelas baru berdasarkan ${selectedKelas.kodeKelas}, memindahkan semua siswa aktif, dan membuat tagihan baru.`}
      onSubmit={form.handleSubmit(onSubmit)}
      isPending={kelasMutations.upLevel.isPending}
      submitText="Proses Naik Kelas"
      cancelText="Batal"
      isOpen={isOpen}
      onOpenChange={handleOpenChange}
    >
      <Form {...form}>
        <UpLevelKelasForm onSubmit={onSubmit} oldKelasData={selectedKelas} />
      </Form>
    </EditDrawer>
  );
}
