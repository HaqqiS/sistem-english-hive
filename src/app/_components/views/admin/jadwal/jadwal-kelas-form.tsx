"use client";

import React, { useMemo, useState } from "react";
import { useFormContext, Controller } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

import { useKelas } from "@/hooks/useKelas";
import { useRuang } from "@/hooks/useRuang";
import { useJam } from "@/hooks/useJam";
import type { TypeServerCreateJadwalSchema } from "@/types/jadwalKelas.type";
import { Hari, TipeKelas } from "@prisma/client";
import { Badge } from "@/components/ui/badge";

interface JadwalKelasFormProps {
  onSubmit: (data: TypeServerCreateJadwalSchema) => void;
}

export default function JadwalKelasForm({ onSubmit }: JadwalKelasFormProps) {
  const form = useFormContext<TypeServerCreateJadwalSchema>();
  const { watch, setValue, clearErrors } = form;

  // State internal untuk mengontrol RadioGroup
  const [jamSelection, setJamSelection] = useState<string | undefined>(
    undefined,
  );

  // 1. Ambil semua data yang diperlukan
  const { data: dataKelas, isLoading: isLoadingKelas } = useKelas();
  const { data: dataRuang, isLoading: isLoadingRuang } = useRuang();
  const { dataJamTetap: dataJamSlot, isLoadingJamTetap: isLoadingJamSlot } =
    useJam();

  // 2. Amati field kunci
  const selectedKelasId = watch("kelasId");
  const selectedRuangId = watch("ruangId");

  // 3. Dapatkan data turunan berdasarkan apa yang di-watch
  const { tipeKelas, cabangId } = useMemo(() => {
    const selectedKelas = dataKelas?.find((k) => k.id === selectedKelasId);
    const selectedRuang = dataRuang?.find((r) => r.id === selectedRuangId);
    return {
      tipeKelas: selectedKelas?.tipe,
      cabangId: selectedRuang?.cabangId,
    };
  }, [selectedKelasId, selectedRuangId, dataKelas, dataRuang]);

  // 4. Filter slot jam berdasarkan cabangId dari ruang yang dipilih
  const filteredJamSlots = useMemo(() => {
    if (!cabangId || !dataJamSlot) return [];
    return dataJamSlot.filter((slot) => slot.cabangId === cabangId);
  }, [cabangId, dataJamSlot]);

  // 5. Handler saat pilihan jam (RadioGroup) berubah
  const handleJamSelectionChange = (value: string) => {
    setJamSelection(value);
    clearErrors(["jamMulai", "jamSelesai", "jamSlotTetapId"]); // Hapus error lama

    if (value === "CUSTOM") {
      // User memilih "Other" (Kelas Privat)
      setValue("tipeJam", "CUSTOM");
      setValue("jamSlotTetapId", undefined); // Kosongkan ID slot tetap
    } else {
      // User memilih slot reguler
      setValue("tipeJam", "TETAP");
      setValue("jamSlotTetapId", value); // Set ID slot tetap
      setValue("jamMulai", undefined); // Kosongkan jam custom
      setValue("jamSelesai", undefined); // Kosongkan jam custom
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Pilih Kelas */}
      <FormField
        control={form.control}
        name="kelasId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Pilih Kelas</FormLabel>
            <FormControl>
              <Select
                onValueChange={field.onChange}
                value={field.value}
                disabled={isLoadingKelas}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kelas..." />
                </SelectTrigger>
                <SelectContent>
                  {dataKelas?.map((kelas) => (
                    <SelectItem key={kelas.id} value={kelas.id}>
                      {kelas.kodeKelas}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Pilih Ruang */}
      <FormField
        control={form.control}
        name="ruangId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Pilih Ruang</FormLabel>
            <FormControl>
              <Select
                onValueChange={field.onChange}
                value={field.value}
                disabled={isLoadingRuang}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih ruang..." />
                </SelectTrigger>
                <SelectContent>
                  {dataRuang?.map((ruang) => (
                    <SelectItem key={ruang.id} value={ruang.id}>
                      {ruang.namaRuang} (Cabang: {ruang.cabang.namaCabang})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Pilih Hari */}
      <FormField
        control={form.control}
        name="hari"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Pilih Hari</FormLabel>
            <FormControl>
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih hari..." />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(Hari).map((hari) => (
                    <SelectItem key={hari} value={hari}>
                      {hari}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Pilihan Jam (Dinamis) */}
      <FormItem>
        <FormLabel>Pilih Jam</FormLabel>
        {!selectedRuangId ? (
          <Alert variant="destructive">
            <Info className="h-4 w-4" />
            <AlertDescription>
              Pilih Ruang terlebih dahulu untuk melihat slot jam.
            </AlertDescription>
          </Alert>
        ) : isLoadingJamSlot ? (
          <Skeleton className="h-20 w-full" />
        ) : (
          <Controller
            control={form.control}
            name="tipeJam" // Field ini dikontrol oleh RadioGroup
            render={() => (
              <RadioGroup
                value={jamSelection}
                onValueChange={handleJamSelectionChange}
                className="space-y-2"
              >
                {/* Render Slot Jam Tetap */}
                {filteredJamSlots.length > 0 ? (
                  filteredJamSlots.map((slot) => (
                    <FormItem
                      key={slot.id}
                      className="flex items-center space-y-0 space-x-3"
                    >
                      <FormControl>
                        <RadioGroupItem value={slot.id} id={slot.id} />
                      </FormControl>
                      <Label htmlFor={slot.id} className="font-normal">
                        {slot.namaSlot} ({slot.jamMulai} - {slot.jamSelesai})
                      </Label>
                    </FormItem>
                  ))
                ) : (
                  <Label className="text-muted-foreground text-sm">
                    Belum ada slot jam tetap untuk cabang ini.
                  </Label>
                )}

                {/* Render Opsi "Other" (Privat) */}
                <FormItem className="flex items-center space-y-0 space-x-3">
                  <FormControl>
                    <RadioGroupItem value="CUSTOM" id="custom-jam" />
                  </FormControl>
                  <Label htmlFor="custom-jam" className="font-normal">
                    Other (Input Manual)
                  </Label>
                  {tipeKelas === TipeKelas.REGULAR && (
                    <Badge variant="secondary">Hanya untuk kelas Privat</Badge>
                  )}
                </FormItem>
              </RadioGroup>
            )}
          />
        )}
      </FormItem>

      {/* Input Jam Manual (Kondisional) */}
      {jamSelection === "CUSTOM" && (
        <div className="grid grid-cols-2 gap-4 rounded-md border p-4">
          <FormField
            control={form.control}
            name="jamMulai"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Jam Mulai (Privat)</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="jamSelesai"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Jam Selesai (Privat)</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      )}
    </form>
  );
}
