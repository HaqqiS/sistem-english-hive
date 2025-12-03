"use client";

import React, { useEffect, useMemo } from "react";
import {
  useFormContext,
  useFieldArray,
  useWatch,
  type Control,
  type UseFormSetValue,
  type UseFormTrigger,
} from "react-hook-form";
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
import { Info, Plus, Trash2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { useKelas } from "@/hooks/useKelas";
import { useRuang } from "@/hooks/useRuang";
import { useJam } from "@/hooks/useJam";
import { Hari, TipeKelas } from "@prisma/client";
import type {
  TypeServerCreateBulkJadwalSchema,
  TypeServerCreateJadwalSchema,
} from "@/types/jadwalKelas.type";

// Tipe Schema Form Wrapper
type FormSchemaType = {
  schedules: TypeServerCreateBulkJadwalSchema;
};

// =========================================================
// 1. KOMPONEN CHILD (ITEM JADWAL)
// =========================================================

interface ScheduleItemRowProps {
  index: number;
  control: Control<FormSchemaType>;
  setValue: UseFormSetValue<FormSchemaType>;
  trigger: UseFormTrigger<FormSchemaType>;
  remove: (index: number) => void;
  firstItemKelasId: string | undefined; // ID Kelas dari parent
}

function ScheduleItemRow({
  index,
  control,
  setValue,
  trigger,
  remove,
  firstItemKelasId,
}: ScheduleItemRowProps) {
  // --- DATA FETCHING ---
  const { data: dataRuang, isLoading: isLoadingRuang } = useRuang();
  const { dataJamTetap: dataJamSlot, isLoadingJamTetap: isLoadingJamSlot } =
    useJam();
  const { dataKelasAktif: dataKelas } = useKelas();

  // --- WATCH FIELDS ---
  const currentRuangId = useWatch({
    control,
    name: `schedules.${index}.ruangId`,
  });
  // const currentJamTetapId = useWatch({
  //   control,
  //   name: `schedules.${index}.jamSlotTetapId`,
  // });

  // --- LOGIC OTOMATIS TIPE JAM ---

  // 1. Cek Tipe Kelas (Reguler / Privat)
  const selectedKelasInfo = useMemo(
    () => dataKelas?.find((k) => k.id === firstItemKelasId),
    [dataKelas, firstItemKelasId],
  );
  const isPrivateClass = selectedKelasInfo?.tipe === TipeKelas.PRIVATE;

  // 2. Effect: Set tipeJam otomatis saat kelas berubah
  useEffect(() => {
    if (isPrivateClass) {
      setValue(`schedules.${index}.tipeJam`, "CUSTOM");
      setValue(`schedules.${index}.jamSlotTetapId`, undefined);
    } else {
      setValue(`schedules.${index}.tipeJam`, "TETAP");
      setValue(`schedules.${index}.jamMulai`, undefined);
      setValue(`schedules.${index}.jamSelesai`, undefined);
    }
    // Trigger validasi agar error state bersih
    // void trigger(`schedules.${index}`);
  }, [isPrivateClass, setValue, index]);

  // 3. Filter Jam Slot berdasarkan Cabang Ruang
  const currentCabangId = useMemo(() => {
    return dataRuang?.find((r) => r.id === currentRuangId)?.cabangId;
  }, [dataRuang, currentRuangId]);

  const filteredJamSlots = useMemo(() => {
    if (!currentCabangId || !dataJamSlot) return [];
    return dataJamSlot.filter((slot) => slot.cabangId === currentCabangId);
  }, [currentCabangId, dataJamSlot]);

  return (
    <Card className="relative border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base font-medium">
            Jadwal Pertemuan #{index + 1}
            {isPrivateClass ? (
              <Badge variant="secondary">Privat (Custom Jam)</Badge>
            ) : (
              <Badge variant="outline">Reguler (Jam Tetap)</Badge>
            )}
          </CardTitle>
          {index > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8"
              onClick={() => remove(index)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Hidden Field: Sinkronisasi Kelas ID */}
        <FormField
          control={control}
          name={`schedules.${index}.kelasId`}
          render={({ field }) => (
            <input type="hidden" {...field} value={firstItemKelasId} />
          )}
        />

        {/* Hidden Field: Tipe Jam (Diset otomatis oleh useEffect di atas) */}
        <FormField
          control={control}
          name={`schedules.${index}.tipeJam`}
          render={({ field }) => <input type="hidden" {...field} />}
        />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Pilih Ruang */}
          <FormField
            control={control}
            name={`schedules.${index}.ruangId`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pilih Ruang</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={isLoadingRuang}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih ruang..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {dataRuang?.map((ruang) => (
                      <SelectItem key={ruang.id} value={ruang.id}>
                        {ruang.namaRuang} ({ruang.cabang.namaCabang})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Pilih Hari */}
          <FormField
            control={control}
            name={`schedules.${index}.hari`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pilih Hari</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih hari..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.values(Hari).map((hari) => (
                      <SelectItem key={hari} value={hari}>
                        {hari}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="pt-2">
          {/* --- KONDISI 1: KELAS REGULER (PILIH SLOT) --- */}
          {!isPrivateClass && (
            <FormField
              control={control}
              name={`schedules.${index}.jamSlotTetapId`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pilih Slot Waktu (Reguler)</FormLabel>
                  {!currentRuangId ? (
                    <Alert variant="destructive" className="py-2">
                      <Info className="h-4 w-4" />
                      <AlertDescription className="text-xs">
                        Pilih Ruang dulu untuk melihat slot jam yang tersedia di
                        cabang tersebut.
                      </AlertDescription>
                    </Alert>
                  ) : isLoadingJamSlot ? (
                    <Skeleton className="h-20 w-full" />
                  ) : filteredJamSlots.length === 0 ? (
                    <Alert
                      variant="destructive"
                      className="border-yellow-200 bg-yellow-50 py-2 text-yellow-800"
                    >
                      <Info className="h-4 w-4" />
                      <AlertDescription className="text-xs">
                        Tidak ada slot jam reguler di cabang ini.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="grid grid-cols-1 gap-2 sm:grid-cols-2"
                    >
                      {filteredJamSlots.map((slot) => (
                        <FormItem key={slot.id}>
                          {/* <FormControl>
                            <RadioGroupItem value={slot.id} 
                            className="hover:bg-accent flex cursor-pointer items-center space-y-0 space-x-3 rounded-md border p-3" 
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <Label className="cursor-pointer font-medium">
                              {slot.namaSlot}
                            </Label>
                            <p className="text-muted-foreground text-xs">
                              {slot.jamMulai} - {slot.jamSelesai}
                            </p>
                          </div> */}
                          <Label
                            htmlFor={`slot-${index}-${slot.id}`}
                            className="hover:bg-accent has-data-[state=checked]:border-primary has-data-[state=checked]:bg-primary/5 flex cursor-pointer items-center space-x-3 rounded-md border p-3 transition-all"
                            // className="hover:bg-accent flex cursor-pointer items-center space-y-0 space-x-3 rounded-md border p-3"
                          >
                            <FormControl>
                              <RadioGroupItem
                                value={slot.id}
                                id={`slot-${index}-${slot.id}`}
                              />
                            </FormControl>
                            <div className="flex-1 space-y-1 leading-none">
                              <div className="text-sm font-medium">
                                {slot.namaSlot}
                              </div>
                              <div className="text-muted-foreground flex items-center gap-1 text-xs font-normal">
                                <Clock className="h-3 w-3" />
                                {slot.jamMulai} - {slot.jamSelesai}
                              </div>
                            </div>
                          </Label>
                        </FormItem>
                      ))}
                    </RadioGroup>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* --- KONDISI 2: KELAS PRIVATE (INPUT MANUAL / CUSTOM) --- */}
          {isPrivateClass && (
            <div className="bg-muted/10 space-y-3 rounded-md border border-dashed p-4">
              <div className="text-primary flex items-center gap-2 text-sm font-medium">
                <Clock className="h-4 w-4" />
                Atur Waktu Custom
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={control}
                  name={`schedules.${index}.jamMulai`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Jam Mulai</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name={`schedules.${index}.jamSelesai`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Jam Selesai</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <p className="text-muted-foreground text-[10px]">
                *Durasi kelas privat harus 90 menit. Sistem akan otomatis
                menggunakan jam yang sudah ada jika waktu sama.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// =========================================================
// 2. KOMPONEN PARENT (FORM UTAMA)
// =========================================================

export default function JadwalKelasForm({
  onSubmit,
}: {
  onSubmit: (data: FormSchemaType["schedules"]) => void;
}) {
  const form = useFormContext<FormSchemaType>();
  const { control, setValue, trigger, handleSubmit } = form;

  const { fields, append, remove } = useFieldArray({
    control,
    name: "schedules",
  });

  const { dataKelasAktif: dataKelas, isLoadingKelasAktif: isLoadingKelas } =
    useKelas({
      enableQueryGetKelasId: true,
      enableQueryGetKelasCount: false,
    });

  // --- GLOBAL STATE (KELAS) ---
  const firstItemKelasId = useWatch({
    control,
    name: `schedules.0.kelasId`,
  });

  const handleGlobalClassChange = (kelasId: string) => {
    // Update semua item yang ada agar kelasId-nya sama
    fields.forEach((_, index) => {
      setValue(`schedules.${index}.kelasId`, kelasId);

      // Trigger validasi ulang untuk tipe jam (karena kelas berubah, tipe mungkin berubah)
      // Namun karena kita pakai useEffect di child row, update tipeJam akan terjadi otomatis di sana.
    });
  };

  const handleAddSchedule = () => {
    // Buat objek dengan tipe eksplisit agar Typescript tidak komplain "any"
    // Kita gunakan varian 'TETAP' sebagai default yang aman
    // Untuk 'hari', kita cast ke Hari agar sesuai tipe, tapi nilainya string kosong untuk UI placeholder
    const newItem: TypeServerCreateJadwalSchema = {
      kelasId: firstItemKelasId || "",
      ruangId: "",
      hari: "" as unknown as Hari,
      tipeJam: "TETAP",
      jamSlotTetapId: "",
      jamMulai: undefined,
      jamSelesai: undefined,
    };

    append(newItem);
  };

  return (
    <form
      onSubmit={handleSubmit((data) => onSubmit(data.schedules))}
      className="space-y-6"
    >
      {/* --- GLOBAL CLASS SELECTION --- */}
      <div className="space-y-2">
        <Label>Pilih Kelas (Berlaku untuk semua jadwal)</Label>
        <Select
          value={firstItemKelasId}
          onValueChange={handleGlobalClassChange}
          disabled={isLoadingKelas}
        >
          <SelectTrigger>
            <SelectValue placeholder="Pilih kelas..." />
          </SelectTrigger>
          <SelectContent>
            {dataKelas?.map((kelas) => (
              <SelectItem key={kelas.id} value={kelas.id}>
                {kelas.kodeKelas}{" "}
                <span className="text-muted-foreground text-xs">
                  ({kelas.tipe})
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FormField
          control={control}
          name={`schedules.0.kelasId`}
          render={() => <FormMessage />}
        />
      </div>

      <div className="space-y-4">
        {fields.map((field, index) => (
          <ScheduleItemRow
            key={field.id}
            index={index}
            control={control}
            setValue={setValue}
            trigger={trigger}
            remove={remove}
            firstItemKelasId={firstItemKelasId}
          />
        ))}
      </div>

      {/* --- ADD BUTTON --- */}
      {fields.length < 2 && (
        <Button
          type="button"
          variant="secondary"
          className="w-full border border-dashed"
          onClick={handleAddSchedule}
        >
          <Plus className="mr-2 h-4 w-4" />
          Tambah Jadwal Hari Lain
        </Button>
      )}
    </form>
  );
}
