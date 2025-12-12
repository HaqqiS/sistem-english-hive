"use client";

import { Form } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  serverUpdateJadwalSchema,
  type TypeServerUpdateJadwalSchema,
} from "@/types/jadwalKelas.type";
import { useJadwalKelas } from "@/hooks/useJadwalKelas";
import { useJadwalKelasStore } from "@/store/useJadwalKelasStore";
import { EditDrawer } from "@/app/_components/shared/edit-drawer";
import EditJadwalKelasForm from "./edit-jadwal-kelas-form";

export default function EditJadwalKelas() {
  const { isDrawerOpen, selectedJadwalKelas, closeDrawer, clearSelected } =
    useJadwalKelasStore();
  const isOpen = isDrawerOpen("edit");

  const formValues: TypeServerUpdateJadwalSchema | undefined =
    selectedJadwalKelas
      ? selectedJadwalKelas.jamSlotCustom
        ? {
            id: selectedJadwalKelas.id,
            kelasId: selectedJadwalKelas.kelasId,
            ruangId: selectedJadwalKelas.ruangId,
            hari: selectedJadwalKelas.hari,
            tipeJam: "CUSTOM",
            jamMulai: selectedJadwalKelas.jamSlotCustom.jamMulai,
            jamSelesai: selectedJadwalKelas.jamSlotCustom.jamSelesai,
          }
        : {
            id: selectedJadwalKelas.id,
            kelasId: selectedJadwalKelas.kelasId,
            ruangId: selectedJadwalKelas.ruangId,
            hari: selectedJadwalKelas.hari,
            tipeJam: "TETAP",
            jamSlotTetapId: selectedJadwalKelas.jamSlotTetap?.id ?? "",
          }
      : undefined;

  const form = useForm<TypeServerUpdateJadwalSchema>({
    resolver: zodResolver(serverUpdateJadwalSchema),
    values: formValues, // Form otomatis terisi saat selectedJadwalKelas berubah
    defaultValues: {
      id: "",
      kelasId: "",
      ruangId: "",
      hari: undefined,
      tipeJam: "TETAP",
    },
  });

  const { mutations } = useJadwalKelas({
    onSuccessUpdate: () => {
      closeDrawer();
      clearSelected();
      form.reset();
    },
  });

  const handleSubmitEdit = async (data: TypeServerUpdateJadwalSchema) => {
    await mutations.update.mutateAsync(data);
  };

  return (
    <EditDrawer
      isOpen={isOpen}
      onOpenChange={(open) => !open && closeDrawer()}
      title="Edit Jadwal Kelas"
      description="Ubah jadwal kelas yang sudah ada."
      isPending={mutations.update.isPending}
      onSubmit={form.handleSubmit(handleSubmitEdit)}
      submitText="Simpan Perubahan"
      cancelText="Batal"
    >
      <Form {...form}>
        <EditJadwalKelasForm />
      </Form>
    </EditDrawer>
  );
}
