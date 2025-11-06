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
import KelasForm from "../forms/kelas-form";
import { useKelas } from "@/hooks/useKelas";
import GuruKelasForm from "../forms/guru-kelas-form";
import {
  clientHistoryGuruKelasSchema,
  type TypeClientHistoryGuruKelasSchema,
} from "@/types/historyGuruKelas.type";
import { UseHistoryGuruKelas } from "@/hooks/useHistoryGuruKelas";

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

  const guruKelasForm = useForm<TypeClientHistoryGuruKelasSchema>({
    resolver: zodResolver(clientHistoryGuruKelasSchema),
    defaultValues: {
      guruId: "",
      mulaiPada: "",
      statusGuru: "ACTIVE",
      kelasId: "",
    },
  });

  const { mutations: kelasMutations } = useKelas({
    onSuccessCreate: (newKelas) => {
      const historyValues = guruKelasForm.getValues();

      if (historyValues.guruId) {
        historyMutations.create.mutate({
          ...historyValues,
          kelasId: newKelas.id,
        });
      }

      setIsOpen(false);
      form.reset();
      guruKelasForm.reset();
    },
  });

  const { mutations: historyMutations } = UseHistoryGuruKelas({
    onSuccessCreate: () => {
      setIsOpen(false);
      form.reset();
      guruKelasForm.reset();
    },
  });

  const onSubmit = (values: TypeClientKelasSchema) => {
    kelasMutations.create.mutate(values);
  };

  const isPending =
    kelasMutations.create.isPending || historyMutations.create.isPending;

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
        isPending={isPending}
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
          <KelasForm onSubmit={onSubmit} />
        </Form>

        <Form {...guruKelasForm}>
          <GuruKelasForm isDisabled={isPending} />
        </Form>
      </AddDrawer>
    </>
  );
}
