/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/app/_components/ui/form";
import { Input } from "@/app/_components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/_components/ui/select";
import { Textarea } from "@/app/_components/ui/textarea";
import { api } from "@/trpc/react";
import type { TypeClientCabangSchema } from "@/types/cabang.type";
import Image from "next/image";
import { useMemo } from "react";
import { useFormContext } from "react-hook-form";
import { toast } from "sonner";

type PemasukanFormProps = {
  onSubmit: (data: TypeClientCabangSchema) => void;
};

export default function CabangForm({ onSubmit }: PemasukanFormProps) {
  const form = useFormContext<TypeClientCabangSchema>();

  // const { data: kategoris } = api.kategori.getKategori.useQuery({
  //   type: TypeKategori.PEMASUKAN,
  // });

  // const transaksiImageValue = form.watch("transaksiImage");

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <div className="flex flex-col gap-6 overflow-y-scroll">
        <div className="grid gap-3">
          <FormField
            control={form.control}
            name="nama"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nama Cabang</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Masukkan nama cabang"
                    {...field}
                    required
                    autoFocus
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        {/* <div className="grid gap-6 md:grid-cols-2 md:gap-3"> */}
        <div className="grid gap-3">
          <FormField
            control={form.control}
            name="alamat"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Alamat</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Masukkan alamat cabang"
                    {...field}
                    required
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid gap-3">
          <FormField
            control={form.control}
            name="noTelp"
            render={({ field }) => (
              <FormItem>
                <FormLabel>No Telepon</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Masukkan no telepon cabang"
                    {...field}
                    required
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    </form>
  );
}
