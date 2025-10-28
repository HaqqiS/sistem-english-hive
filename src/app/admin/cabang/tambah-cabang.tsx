"use client";

import { DrawerDialog } from "@/app/_components/shared/drawer-dialog";
import { Button } from "@/app/_components/ui/button";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  Form,
} from "@/app/_components/ui/form";
import { Input } from "@/app/_components/ui/input";
import { api } from "@/trpc/react";
import {
  clientCabangSchema,
  type TypeClientCabangSchema,
} from "@/types/cabang.type";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

export default function TambahCabang() {
  const [isOpenAddBranch, setIsOpenAddBranch] = useState(false);

  const form = useForm<TypeClientCabangSchema>({
    resolver: zodResolver(clientCabangSchema),
    defaultValues: {
      nama: "",
      alamat: "",
      noTelp: "",
    },
  });

  const { mutateAsync: createCabang } = api.cabang.createCabang.useMutation();

  function onSubmit(values: TypeClientCabangSchema) {
    console.log(values);

    const promise = async () => {
      await createCabang(values);
    };

    toast.promise(promise(), {
      richColors: true,
      loading: "Menambahkan cabang...",
      success: () => {
        setIsOpenAddBranch(false);
        form.reset();
        return "Cabang berhasil ditambahkan";
      },
      error: (err: unknown) => {
        if (err instanceof Error) {
          return err.message;
        }
        return "Gagal membuat cabang: Terjadi kesalahan tidak dikenal.";
      },
    });
  }

  return (
    <div>
      <Button onClick={() => setIsOpenAddBranch(true)}>Tambah Cabang</Button>
      <DrawerDialog
        title="Tambah Cabang"
        isOpen={isOpenAddBranch}
        onOpenChange={setIsOpenAddBranch}
        onSubmit={() => form.handleSubmit(onSubmit)()}
      >
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="nama"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Cabang</FormLabel>
                  <FormControl>
                    <Input placeholder="Nama Cabang" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="alamat"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Alamat Cabang</FormLabel>
                  <FormControl>
                    <Input placeholder="Alamat Cabang" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="noTelp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>No Telepon Cabang</FormLabel>
                  <FormControl>
                    <Input placeholder="No Telepon Cabang" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
      </DrawerDialog>
    </div>
  );
}
