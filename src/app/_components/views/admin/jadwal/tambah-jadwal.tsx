"use client";

import { AddDrawer } from "@/app/_components/shared/add-drawer";
import { Form } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  serverCreateJadwalSchema as clientCreateJadwalSchema,
  serverCreateBulkJadwalSchema, // Ganti nama skema di file type jika perlu
  type TypeServerCreateJadwalSchema,
} from "@/types/jadwalKelas.type";
import JadwalKelasForm from "./jadwal-kelas-form";
import { useJadwalKelas } from "@/hooks/useJadwalKelas";
import z from "zod";

const formSchema = z.object({
  schedules: serverCreateBulkJadwalSchema,
});

type FormSchemaType = z.infer<typeof formSchema>;

export default function TambahJadwalKelas() {
  const [isOpen, setIsOpen] = useState(false);

  const form = useForm<FormSchemaType>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      schedules: [
        {
          kelasId: "",
          ruangId: "",
          hari: undefined,
          tipeJam: undefined,
          jamSlotTetapId: undefined,
          jamMulai: undefined,
          jamSelesai: undefined,
        },
      ],
    },
  });

  const { mutations } = useJadwalKelas({
    onSuccessCreate: () => {
      form.reset();
      setIsOpen(false);
    },
  });

  const onSubmit = (schedules: FormSchemaType["schedules"]) => {
    // console.log("Submitting Bulk Jadwal:", schedules);
    mutations.create.mutate(schedules);
  };
  return (
    <AddDrawer
      title="Tambah Jadwal Kelas"
      description="Buat jadwal (Reguler/Privat) untuk kelas. Maksimal 2 jadwal sekaligus."
      onSubmit={form.handleSubmit((data) => onSubmit(data.schedules))}
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
