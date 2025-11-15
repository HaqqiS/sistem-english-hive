"use client";

import { AddDrawer } from "@/app/_components/shared/add-drawer";
import { Form } from "@/components/ui/form";
import {
  clientCabangSchema,
  type TypeClientCabangSchema,
} from "@/types/cabang.type";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import CabangForm from "../forms/cabang-form";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useCabang } from "../../../../../../hooks/useCabang";

export default function TambahCabang() {
  const [isOpen, setIsOpen] = useState(false);

  const form = useForm<TypeClientCabangSchema>({
    resolver: zodResolver(clientCabangSchema),
    defaultValues: {
      namaCabang: "",
      alamat: "",
      noTelp: "",
    },
  });

  const { mutations } = useCabang({
    onSuccessCreate: () => {
      form.reset();
      setIsOpen(false);
    },
  });

  const onSubmit = (values: TypeClientCabangSchema) => {
    mutations.create.mutate(values);
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
        isPending={mutations.create.isPending}
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
