"use client";

import { AddDrawer } from "@/app/_components/shared/add-drawer";
import { Form } from "@/components/ui/form";
import { api } from "@/trpc/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  clientRuangSchema,
  type TypeClientRuangSchema,
} from "@/types/ruang.type";
import RuangForm from "../forms/ruang-form";

export default function TambahRuang() {
  const [isOpen, setIsOpen] = useState(false);

  const form = useForm<TypeClientRuangSchema>({
    resolver: zodResolver(clientRuangSchema),
    defaultValues: {
      namaRuang: "",
      kodeRuang: "",
      cabangId: "",
    },
  });

  const { mutate: createRuang, isPending } = api.ruang.createRuang.useMutation({
    onSuccess: () => {
      toast.success("Ruang berhasil ditambahkan");
      form.reset();
      setIsOpen(false);
    },
    onError: (error) => {
      toast.error(`Gagal membuat Ruang: ${error.message}`);
    },
  });

  const onSubmit = (values: TypeClientRuangSchema) => {
    // console.log(values);
    createRuang(values);
  };

  return (
    <>
      {/* <Button onClick={() => setIsOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Tambah Cabang
      </Button> */}

      <AddDrawer
        title="Tambah Ruang"
        description="Tambahkan ruang baru ke sistem"
        onSubmit={form.handleSubmit(onSubmit)}
        isPending={isPending}
        submitText="Tambah Ruang"
        cancelText="Batal"
        trigger={
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Ruang
          </Button>
        }
        isOpen={isOpen}
        onOpenChange={setIsOpen}
      >
        <Form {...form}>
          <RuangForm onSubmit={onSubmit} />
        </Form>
      </AddDrawer>
    </>
  );
}
