"use client";

import { AddDrawer } from "@/app/_components/shared/add-drawer";
import { Form } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  clientKelasSchema,
  type TypeClientKelasSchema,
} from "@/types/kelas.type";
import ProgramKelasForm from "../kelas-form";
import { useKelas } from "@/hooks/useKelas";

export default function TambahKelas() {
  const [isOpen, setIsOpen] = useState(false);

  const form = useForm<TypeClientKelasSchema>({
    resolver: zodResolver(clientKelasSchema),
    defaultValues: {
      jenisKelas: undefined,
      level: 1,
      tipe: undefined,
      grup: "",
      kodeKelas: "",
      bulanTahunAjar: "",
      hargaKelas: 0,
      deskripsi: "",
    },
  });

  const { mutations } = useKelas({
    onSuccessCreate: () => {
      form.reset();
      setIsOpen(false);
    },
  });

  const onSubmit = (values: TypeClientKelasSchema) => {
    mutations.create.mutate(values);
  };

  return (
    <>
      {/* <Button onClick={() => setIsOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Tambah Cabang
      </Button> */}

      <AddDrawer
        title="Tambah Program Kelas"
        description="Tambahkan program kelas baru ke sistem"
        onSubmit={form.handleSubmit(onSubmit)}
        isPending={mutations.create.isPending}
        submitText="Tambah Program Kelas"
        cancelText="Batal"
        trigger={
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Program Kelas
          </Button>
        }
        isOpen={isOpen}
        onOpenChange={setIsOpen}
      >
        <Form {...form}>
          <ProgramKelasForm onSubmit={onSubmit} />
        </Form>
      </AddDrawer>
    </>
  );
}
