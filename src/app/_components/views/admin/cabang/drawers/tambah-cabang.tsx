"use client";

import { AddDrawer } from "@/app/_components/shared/add-drawer";
import { Form } from "@/components/ui/form";
import { api } from "@/trpc/react";
import {
  clientCabangSchema,
  type TypeClientCabangSchema,
} from "@/types/cabang.type";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import CabangForm from "../forms/cabang-form";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function TambahCabang() {
  const [isOpen, setIsOpen] = useState(false);

  const form = useForm<TypeClientCabangSchema>({
    resolver: zodResolver(clientCabangSchema),
    defaultValues: {
      nama: "",
      alamat: "",
      noTelp: "",
    },
  });

  const { mutate: createCabang, isPending } =
    api.cabang.createCabang.useMutation({
      onSuccess: () => {
        toast.success("Cabang berhasil ditambahkan");
        form.reset();
        setIsOpen(false);
      },
      onError: (error) => {
        toast.error(`Gagal membuat cabang: ${error.message}`);
      },
    });

  const onSubmit = (values: TypeClientCabangSchema) => {
    createCabang(values);
  };

  return (
    <>
      {/* <Button onClick={() => setIsOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Tambah Cabang
      </Button> */}

      <AddDrawer
        title="Tambah Cabang"
        description="Tambahkan cabang baru ke sistem"
        onSubmit={form.handleSubmit(onSubmit)}
        isPending={isPending}
        submitText="Tambah Cabang"
        cancelText="Batal"
        trigger={
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Cabang
          </Button>
        }
        isOpen={isOpen}
        onOpenChange={setIsOpen}
      >
        <Form {...form}>
          <CabangForm onSubmit={onSubmit} />
        </Form>
      </AddDrawer>
    </>
  );
}
