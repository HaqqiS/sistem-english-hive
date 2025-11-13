"use client";

import { AddDrawer } from "@/app/_components/shared/add-drawer";
import { Form } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  serverCreateJadwalSchema as clientCreateJadwalSchema, // Ganti nama skema di file type jika perlu
  type TypeServerCreateJadwalSchema,
} from "@/types/jadwalKelas.type";
import JadwalKelasForm from "./jadwal-kelas-form";
import { useJadwalKelas } from "@/hooks/useJadwalKelas";
import { TipeKelas } from "@prisma/client";

export default function TambahJadwalKelas() {
  const [isOpen, setIsOpen] = useState(false);

  const form = useForm<TypeServerCreateJadwalSchema>({
    resolver: zodResolver(clientCreateJadwalSchema),
    defaultValues: {
      kelasId: "",
      ruangId: "",
      hari: undefined,
      tipeJam: undefined, // Biarkan Zod yang menentukan
      jamSlotTetapId: undefined,
      jamMulai: undefined,
      jamSelesai: undefined,
    },
  });

  const { mutations } = useJadwalKelas({
    onSuccessCreate: () => {
      form.reset();
      setIsOpen(false);
    },
  });

  const onSubmit = (values: TypeServerCreateJadwalSchema) => {
    console.log("Submitting Jadwal:", values);
    mutations.create.mutate(values);
  };

  return (
    <AddDrawer
      title="Tambah Jadwal Kelas"
      description="Buat jadwal tetap atau privat baru untuk sebuah kelas."
      onSubmit={form.handleSubmit(onSubmit)}
      isPending={mutations.create.isPending}
      submitText="Tambah Jadwal"
      cancelText="Batal"
      trigger={
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Jadwal
        </Button>
      }
      isOpen={isOpen}
      onOpenChange={setIsOpen}
    >
      <Form {...form}>
        <JadwalKelasForm onSubmit={onSubmit} />
      </Form>
    </AddDrawer>
  );
}
