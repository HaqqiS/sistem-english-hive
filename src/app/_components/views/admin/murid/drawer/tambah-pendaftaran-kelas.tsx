"use client";

import { AddDrawer } from "@/app/_components/shared/add-drawer";
import { Form } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  clientBulkPendaftaranKelasSchema,
  type TypeClientBulkPendaftaranKelasSchema,
} from "@/types/pendaftaranKelas.type";
import PendaftaranKelasForm from "../form/pendaftaran-kelas-form";
import { usePendaftaranKelas } from "@/hooks/usePendaftaranKelas";
import { useMurid } from "@/hooks/useMurid";

export default function TambahPendaftaranKelas() {
  const [isOpen, setIsOpen] = useState(false);

  const form = useForm<TypeClientBulkPendaftaranKelasSchema>({
    resolver: zodResolver(clientBulkPendaftaranKelasSchema),
    defaultValues: {
      muridIds: [],
      kelasId: "",
      tanggalMulai: "",
    },
  });

  const { mutations } = usePendaftaranKelas({
    onSuccessCreate: () => {
      form.reset();
      setIsOpen(false);
    },
  });

  const { mutations: muridMutations } = useMurid();

  const onSubmit = (values: TypeClientBulkPendaftaranKelasSchema) => {
    // console.log("values:", values);
    mutations.createBulk.mutate(values);
    values.muridIds.forEach((id) => {
      muridMutations.updateStatus.mutate({
        id: id,
        statusMurid: "AKTIF",
      });
    });
  };

  return (
    <AddDrawer
      title="Daftarkan Murid ke Kelas"
      description="Tambahkan data pendaftaran kelas baru dengan mengisi form di bawah ini."
      onSubmit={form.handleSubmit(onSubmit)}
      isPending={mutations.createBulk.isPending}
      submitText="Tambah Pendaftaran Kelas"
      cancelText="Batal"
      trigger={
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          <p className="sr-only lg:not-sr-only">Daftarkan Murid ke Kelas</p>
          <p className="not-sr-only lg:sr-only">Daftarkan Murid</p>
        </Button>
      }
      isOpen={isOpen}
      onOpenChange={setIsOpen}
    >
      <Form {...form}>
        <PendaftaranKelasForm onSubmit={onSubmit} />
      </Form>
    </AddDrawer>
  );
}
