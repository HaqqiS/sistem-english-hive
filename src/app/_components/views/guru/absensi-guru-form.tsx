/* eslint-disable @typescript-eslint/no-unsafe-assignment */
"use client";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFormContext } from "react-hook-form";
import { StatusAbsenGuru } from "@prisma/client";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { useSesiPertemuan } from "@/hooks/useSesiPertemuan";

interface AbsensiGuruFormProps {
  index: number;
  onRemove: (index: number) => void;
  // onSubmit: (data: TypeClientAbsensiGuruSchema) => void;
}

export default function AbsensiGuruForm({
  index,
  onRemove,
}: AbsensiGuruFormProps) {
  // const form = useFormContext<TypeClientAbsensiGuruSchema>();
  const { control } = useFormContext();

  // const { dataNotUsed: dataNotUsedJadwalSesi, isLoading: isLoadingJadwalSesi } =
  const {
    dataSesiPertemuan: {
      data: dataSesiPertemuan,
      isLoading: isLoadingSesiPertemuan,
    },
  } = useSesiPertemuan();

  return (
    // <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
    <Card className="relative w-full">
      <CardHeader className="absolute top-2 right-8">
        <CardAction>
          <Button
            type="button"
            variant="destructive"
            size="icon-lg"
            className="size-8"
            onClick={() => onRemove(index)}
          >
            <Trash2 />
            <span className="sr-only">Hapus item</span>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="w-full space-y-2">
        <FormField
          control={control}
          name={`absensi.${index}.jadwalSesiId`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Jadwal Sesi</FormLabel>
              <FormControl>
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="w-xs">
                    <SelectValue placeholder="Select Jadwal Sesi" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Pilih Jadwal Sesi</SelectLabel>
                      {isLoadingSesiPertemuan ? (
                        <SelectItem value="loading">Loading...</SelectItem>
                      ) : (
                        dataSesiPertemuan?.map((sesi) => (
                          <SelectItem key={sesi.id} value={sesi.id}>
                            {sesi.kelas.kodeKelas}
                          </SelectItem>
                        ))
                      )}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name={`absensi.${index}.status`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <FormControl>
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="w-xs">
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Status Absen</SelectLabel>
                      {Object.values(StatusAbsenGuru).map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}
