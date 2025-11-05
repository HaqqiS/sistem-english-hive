"use client";

import { AddDrawer } from "@/app/_components/shared/add-drawer";
import { Form } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import AbsensiGuruForm from "./absensi-guru-form";
import {
  clientAbsensiArraySchema,
  type TypeClientAbsensiArraySchema,
} from "@/types/absenGuru.type";
import { useAbsenGuru } from "@/hooks/useAbsenGuru";

export default function TambahAbsensi() {
  const [isOpen, setIsOpen] = useState(false);

  const form = useForm<TypeClientAbsensiArraySchema>({
    resolver: zodResolver(clientAbsensiArraySchema),
    defaultValues: {
      absensi: [{ jadwalSesiId: "", status: "HADIR" }],
    },
  });

  const { mutations } = useAbsenGuru({
    onSuccessCreate: () => {
      form.reset();
      setIsOpen(false);
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "absensi",
  });

  const onSubmit = (values: TypeClientAbsensiArraySchema) => {
    // 'values' akan berbentuk: { absensi: [...] }
    // Mutation Anda (createAbsensi) hanya butuh array-nya saja
    // createAbsensi(values.absensi);
    console.log("value :", values);
    // mutations.create.mutate(values.absensi);
  };

  const handleAddForm = () => {
    // Batasi hingga 5 form sesuai skema
    if (fields.length < 5) {
      append({ jadwalSesiId: "", status: "HADIR" });
    }
  };

  return (
    <>
      {/* <Button onClick={() => setIsOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Tambah Cabang
      </Button> */}

      <AddDrawer
        title="Buat Absensi"
        description="Tambahkan absensi baru ke sistem"
        onSubmit={form.handleSubmit(onSubmit)}
        // isPending={mutations.create.isPending}
        submitText="Buat Absensi"
        cancelText="Batal"
        trigger={
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Buat Absensi
          </Button>
        }
        isOpen={isOpen}
        onOpenChange={setIsOpen}
      >
        <Form {...form}>
          {/* <AbsensiGuruForm onSubmit={onSubmit} /> */}
          <div className="space-y-4">
            {/* Loop 'fields' dari useFieldArray */}
            {fields.map((field, index) => (
              <AbsensiGuruForm
                key={field.id} // 'key' wajib dari 'field.id'
                index={index}
                onRemove={remove} // Teruskan fungsi 'remove'
              />
            ))}

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleAddForm}
              disabled={fields.length >= 5} // Nonaktifkan jika sudah 5
            >
              <Plus className="mr-2 h-4 w-4" />
              Tambah Sesi Lain
            </Button>
          </div>
        </Form>
      </AddDrawer>
    </>
  );
}
