"use client";

import { AddDrawer } from "@/app/_components/shared/add-drawer";
import { Form } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  clientSesiPertemuanSchema,
  type TypeClientSesiPertemuanSchema,
} from "@/types/sesiPertemuan.type";
import SesiPertemuanForm from "./sesi-pertemuan-form";
import { useSesiPertemuan } from "@/hooks/useSesiPertemuan";

export default function TambahSesiPertemuan() {
  const [isOpen, setIsOpen] = useState(false);

  const form = useForm<TypeClientSesiPertemuanSchema>({
    resolver: zodResolver(clientSesiPertemuanSchema),
    defaultValues: {
      kelasId: "",
      ruangId: "",
      tanggalWaktu: undefined,
    },
  });

  const { mutations } = useSesiPertemuan({
    onSuccessCreate: () => {
      form.reset();
      setIsOpen(false);
    },
  });

  const onSubmit = (values: TypeClientSesiPertemuanSchema) => {
    console.log(values);
    mutations.create.mutate(values);
  };

  return (
    <>
      {/* <Button onClick={() => setIsOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Tambah Cabang
      </Button> */}

      <AddDrawer
        title="Tambah Jadwal Sesi"
        description="Tambahkan Jadwal Sesi baru ke sistem"
        onSubmit={form.handleSubmit(onSubmit)}
        isPending={mutations.create.isPending}
        submitText="Tambah Jadwal Sesi"
        cancelText="Batal"
        trigger={
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Jadwal Sesi
          </Button>
        }
        isOpen={isOpen}
        onOpenChange={setIsOpen}
      >
        <Form {...form}>
          <SesiPertemuanForm onSubmit={onSubmit} />
        </Form>
      </AddDrawer>
    </>
  );
}
