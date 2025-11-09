"use client";

import { AddDrawer } from "@/app/_components/shared/add-drawer";
import { Form } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import AbsensiGuruForm from "./absensi-guru-form"; // Ini adalah child form
import {
  formSesiAbsensiGuruSchema,
  type TypeFormSesiAbsensiGuru,
} from "@/types/absenGuru.type";
import { useAbsenGuru } from "@/hooks/useAbsenGuru";
import { StatusAbsenGuru } from "@prisma/client";

export default function TambahAbsensi() {
  const [isOpen, setIsOpen] = useState(false);

  // 1. useForm dan useFieldArray sekarang ada di parent
  const form = useForm<TypeFormSesiAbsensiGuru>({
    resolver: zodResolver(formSesiAbsensiGuruSchema),
    defaultValues: {
      absensi: [
        {
          kelasId: "",
          ruangId: "",
          tanggalWaktu: new Date(),
          status: StatusAbsenGuru.HADIR,
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "absensi",
  });

  // 2. Gunakan hook yang benar
  const { mutations } = useAbsenGuru({
    onSuccessCreate: () => {
      form.reset();
      setIsOpen(false);
    },
  });

  // 3. onSubmit sekarang menerima tipe form yang benar
  const onSubmit = (values: TypeFormSesiAbsensiGuru) => {
    // Kirim array 'absensi' ke mutasi, sesuai input di backend
    mutations.create.mutate(values.absensi);
  };

  const handleAddForm = () => {
    if (fields.length < 5) {
      append({
        kelasId: "",
        ruangId: "",
        tanggalWaktu: new Date(),
        status: StatusAbsenGuru.HADIR,
      });
    }
  };

  return (
    <AddDrawer
      title="Buat Absensi"
      description="Tambahkan absensi baru. Ini akan membuat Sesi Pertemuan dan Absensi Anda sekaligus."
      onSubmit={form.handleSubmit(onSubmit)} // 4. Hubungkan ke form submit
      isPending={mutations.create.isPending}
      submitText="Buat Absensi"
      cancelText="Batal"
      trigger={
        <Button onClick={() => setIsOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Buat Absensi
        </Button>
      }
      isOpen={isOpen}
      onOpenChange={setIsOpen}
    >
      {/* 5. Bungkus form di dalam Drawer */}
      <Form {...form}>
        <form
          id="absensi-guru-form"
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-6"
        >
          {fields.map((field, index) => (
            <AbsensiGuruForm
              key={field.id}
              control={form.control} // Pass control
              index={index}
              onRemove={remove} // Pass remove
            />
          ))}

          <Button
            type="button"
            variant="secondary"
            disabled={fields.length >= 5}
            onClick={handleAddForm}
          >
            Tambah Absensi
          </Button>
        </form>
      </Form>
    </AddDrawer>
  );
}
