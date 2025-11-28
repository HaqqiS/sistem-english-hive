"use client";

import { AddDrawer } from "@/app/_components/shared/add-drawer";
import { Form } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  clientCreatePembayaranSchema,
  type TypeClientCreatePembayaranSchema,
} from "@/types/pembayaran.type";
import { usePembayaran } from "@/hooks/usePembayaran";
import PembayaranForm from "./pembayaran-form";

export default function TambahPembayaran() {
  const [isOpen, setIsOpen] = useState(false);

  const form = useForm<TypeClientCreatePembayaranSchema>({
    resolver: zodResolver(clientCreatePembayaranSchema),
    defaultValues: {
      pendaftaranKelasId: "",
      jumlahBayar: 0,
      tanggalBayar: "",
      pembayaranKe: undefined,
      note: "",
    },
  });

  const { mutations } = usePembayaran({
    onSuccessCreateManual: () => {
      form.reset();
      setIsOpen(false);
    },
  });

  const onSubmit = (values: TypeClientCreatePembayaranSchema) => {
    console.log("Submitting Pembayaran:", values);
    mutations.createManual.mutate(values);
  };

  return (
    <AddDrawer
      title="Tambah Pembayaran Manual"
      description="Buat pembayaran baru untuk sebuah pendaftaran kelas."
      onSubmit={form.handleSubmit(onSubmit)}
      isPending={mutations.createManual.isPending}
      submitText="Tambah Pembayaran"
      cancelText="Batal"
      trigger={
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Pembayaran
        </Button>
      }
      isOpen={isOpen}
      onOpenChange={setIsOpen}
    >
      <Form {...form}>
        <PembayaranForm onSubmit={onSubmit} />
      </Form>
    </AddDrawer>
  );
}
