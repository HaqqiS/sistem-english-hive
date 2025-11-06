import { AddDrawer } from "@/app/_components/shared/add-drawer";
import { Form } from "@/components/ui/form";
import PendaftaranMuridForm from "./pendaftaran-murid-form";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { usePendaftaranKelas } from "@/hooks/usePendaftaranKelas";
import { clientPendaftaranKelasSchema } from "@/types/pendaftaranKelas.type";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type z from "zod";
import { api } from "@/trpc/react";

const clientTambahMuridSchema = clientPendaftaranKelasSchema.omit({
  kelasId: true,
});

export type TypeClientTambahMuridSchema = z.infer<
  typeof clientTambahMuridSchema
>;

interface TambahMuridDetailKelasProps {
  kelasId?: string;
}

export default function TambahMuridDetailKelas({
  kelasId,
}: TambahMuridDetailKelasProps) {
  const [isOpen, setIsOpen] = useState(false);

  const form = useForm<TypeClientTambahMuridSchema>({
    resolver: zodResolver(clientTambahMuridSchema),
    defaultValues: {
      muridId: "",
    },
  });

  const { mutations } = usePendaftaranKelas({
    onSuccessCreate: () => {
      form.reset();
      setIsOpen(false);
    },
  });

  const onSubmit = (values: TypeClientTambahMuridSchema) => {
    // console.log("values:", values);
    mutations.create.mutate({
      ...values,
      kelasId: kelasId ?? "",
    });
  };

  return (
    <AddDrawer
      title="Tambah Murid ke Kelas"
      description="Tambahkan murid baru ke kelas ini"
      onSubmit={form.handleSubmit(onSubmit)}
      isPending={mutations.create.isPending}
      submitText="Tambah Murid"
      cancelText="Batal"
      trigger={
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Murid
        </Button>
      }
      isOpen={isOpen}
      onOpenChange={setIsOpen}
    >
      <Form {...form}>
        <PendaftaranMuridForm onSubmit={onSubmit} />
      </Form>
    </AddDrawer>
  );
}
