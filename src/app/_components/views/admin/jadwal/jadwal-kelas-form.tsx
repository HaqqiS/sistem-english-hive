// "use client";

// import React, { useMemo, useState } from "react";
// import { useFormContext, Controller } from "react-hook-form";
// import {
//   FormControl,
//   FormField,
//   FormItem,
//   FormLabel,
//   FormMessage,
// } from "@/components/ui/form";
// import { Input } from "@/components/ui/input";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
// import { Label } from "@/components/ui/label";
// import { Skeleton } from "@/components/ui/skeleton";
// import { Alert, AlertDescription } from "@/components/ui/alert";
// import { Info } from "lucide-react";

// import { useKelas } from "@/hooks/useKelas";
// import { useRuang } from "@/hooks/useRuang";
// import { useJam } from "@/hooks/useJam";
// import type { TypeServerCreateJadwalSchema } from "@/types/jadwalKelas.type";
// import { Hari, TipeKelas } from "@prisma/client";
// import { Badge } from "@/components/ui/badge";

// interface JadwalKelasFormProps {
//   onSubmit: (data: TypeServerCreateJadwalSchema) => void;
// }

// export default function JadwalKelasForm({ onSubmit }: JadwalKelasFormProps) {
//   const form = useFormContext<TypeServerCreateJadwalSchema>();
//   const { watch, setValue, clearErrors } = form;

//   // State internal untuk mengontrol RadioGroup
//   const [jamSelection, setJamSelection] = useState<string | undefined>(
//     undefined,
//   );

//   // 1. Ambil semua data yang diperlukan
//   const { dataKelasAktif: dataKelas, isLoadingKelasAktif: isLoadingKelas } =
//     useKelas({
//       enableQueryGetAll: false,
//       enableQueryGetKelasId: true,
//       enableQueryGetKelasCount: false,
//     });
//   const { data: dataRuang, isLoading: isLoadingRuang } = useRuang();
//   const { dataJamTetap: dataJamSlot, isLoadingJamTetap: isLoadingJamSlot } =
//     useJam();

//   // 2. Amati field kunci
//   const selectedKelasId = watch("kelasId");
//   const selectedRuangId = watch("ruangId");

//   // 3. Dapatkan data turunan berdasarkan apa yang di-watch
//   const { tipeKelas, cabangId } = useMemo(() => {
//     const selectedKelas = dataKelas?.find((k) => k.id === selectedKelasId);
//     const selectedRuang = dataRuang?.find((r) => r.id === selectedRuangId);
//     return {
//       tipeKelas: selectedKelas?.tipe,
//       cabangId: selectedRuang?.cabangId,
//     };
//   }, [selectedKelasId, selectedRuangId, dataKelas, dataRuang]);

//   // 4. Filter slot jam berdasarkan cabangId dari ruang yang dipilih
//   const filteredJamSlots = useMemo(() => {
//     if (!cabangId || !dataJamSlot) return [];
//     return dataJamSlot.filter((slot) => slot.cabangId === cabangId);
//   }, [cabangId, dataJamSlot]);

//   // 5. Handler saat pilihan jam (RadioGroup) berubah
//   const handleJamSelectionChange = (value: string) => {
//     setJamSelection(value);
//     clearErrors(["jamMulai", "jamSelesai", "jamSlotTetapId"]); // Hapus error lama

//     if (value === "CUSTOM") {
//       // User memilih "Other" (Kelas Privat)
//       setValue("tipeJam", "CUSTOM");
//       setValue("jamSlotTetapId", undefined); // Kosongkan ID slot tetap
//     } else {
//       // User memilih slot reguler
//       setValue("tipeJam", "TETAP");
//       setValue("jamSlotTetapId", value); // Set ID slot tetap
//       setValue("jamMulai", undefined); // Kosongkan jam custom
//       setValue("jamSelesai", undefined); // Kosongkan jam custom
//     }
//   };

//   return (
//     <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
//       {/* Pilih Kelas */}
//       <FormField
//         control={form.control}
//         name="kelasId"
//         render={({ field }) => (
//           <FormItem>
//             <FormLabel>Pilih Kelas</FormLabel>
//             <FormControl>
//               <Select
//                 onValueChange={field.onChange}
//                 value={field.value}
//                 disabled={isLoadingKelas}
//               >
//                 <SelectTrigger>
//                   <SelectValue placeholder="Pilih kelas..." />
//                 </SelectTrigger>
//                 <SelectContent>
//                   {dataKelas?.map((kelas) => (
//                     <SelectItem key={kelas.id} value={kelas.id}>
//                       {kelas.kodeKelas}
//                     </SelectItem>
//                   ))}
//                 </SelectContent>
//               </Select>
//             </FormControl>
//             <FormMessage />
//           </FormItem>
//         )}
//       />

//       {/* Pilih Ruang */}
//       <FormField
//         control={form.control}
//         name="ruangId"
//         render={({ field }) => (
//           <FormItem>
//             <FormLabel>Pilih Ruang</FormLabel>
//             <FormControl>
//               <Select
//                 onValueChange={field.onChange}
//                 value={field.value}
//                 disabled={isLoadingRuang}
//               >
//                 <SelectTrigger>
//                   <SelectValue placeholder="Pilih ruang..." />
//                 </SelectTrigger>
//                 <SelectContent>
//                   {dataRuang?.map((ruang) => (
//                     <SelectItem key={ruang.id} value={ruang.id}>
//                       {ruang.namaRuang} (Cabang: {ruang.cabang.namaCabang})
//                     </SelectItem>
//                   ))}
//                 </SelectContent>
//               </Select>
//             </FormControl>
//             <FormMessage />
//           </FormItem>
//         )}
//       />

//       {/* Pilih Hari */}
//       <FormField
//         control={form.control}
//         name="hari"
//         render={({ field }) => (
//           <FormItem>
//             <FormLabel>Pilih Hari</FormLabel>
//             <FormControl>
//               <Select onValueChange={field.onChange} value={field.value}>
//                 <SelectTrigger>
//                   <SelectValue placeholder="Pilih hari..." />
//                 </SelectTrigger>
//                 <SelectContent>
//                   {Object.values(Hari).map((hari) => (
//                     <SelectItem key={hari} value={hari}>
//                       {hari}
//                     </SelectItem>
//                   ))}
//                 </SelectContent>
//               </Select>
//             </FormControl>
//             <FormMessage />
//           </FormItem>
//         )}
//       />

//       {/* Pilihan Jam (Dinamis) */}
//       <FormItem>
//         <FormLabel>Pilih Jam</FormLabel>
//         {!selectedRuangId ? (
//           <Alert variant="destructive">
//             <Info className="h-4 w-4" />
//             <AlertDescription>
//               Pilih Ruang terlebih dahulu untuk melihat slot jam.
//             </AlertDescription>
//           </Alert>
//         ) : isLoadingJamSlot ? (
//           <Skeleton className="h-20 w-full" />
//         ) : (
//           <Controller
//             control={form.control}
//             name="tipeJam" // Field ini dikontrol oleh RadioGroup
//             render={() => (
//               <RadioGroup
//                 value={jamSelection}
//                 onValueChange={handleJamSelectionChange}
//                 className="space-y-2"
//               >
//                 {/* Render Slot Jam Tetap */}
//                 {filteredJamSlots.length > 0 ? (
//                   filteredJamSlots.map((slot) => (
//                     <FormItem
//                       key={slot.id}
//                       className="flex items-center space-y-0 space-x-3"
//                     >
//                       <FormControl>
//                         <RadioGroupItem value={slot.id} id={slot.id} />
//                       </FormControl>
//                       <Label htmlFor={slot.id} className="font-normal">
//                         {slot.namaSlot} ({slot.jamMulai} - {slot.jamSelesai})
//                       </Label>
//                     </FormItem>
//                   ))
//                 ) : (
//                   <Label className="text-muted-foreground text-sm">
//                     Belum ada slot jam tetap untuk cabang ini.
//                   </Label>
//                 )}

//                 {/* Render Opsi "Other" (Privat) */}
//                 <FormItem className="flex items-center space-y-0 space-x-3">
//                   <FormControl>
//                     <RadioGroupItem value="CUSTOM" id="custom-jam" />
//                   </FormControl>
//                   <Label htmlFor="custom-jam" className="font-normal">
//                     Other (Input Manual)
//                   </Label>
//                   {tipeKelas === TipeKelas.REGULAR && (
//                     <Badge variant="secondary">Hanya untuk kelas Privat</Badge>
//                   )}
//                 </FormItem>
//               </RadioGroup>
//             )}
//           />
//         )}
//       </FormItem>

//       {/* Input Jam Manual (Kondisional) */}
//       {jamSelection === "CUSTOM" && (
//         <div className="grid grid-cols-2 gap-4 rounded-md border p-4">
//           <FormField
//             control={form.control}
//             name="jamMulai"
//             render={({ field }) => (
//               <FormItem>
//                 <FormLabel>Jam Mulai (Privat)</FormLabel>
//                 <FormControl>
//                   <Input type="time" {...field} />
//                 </FormControl>
//                 <FormMessage />
//               </FormItem>
//             )}
//           />
//           <FormField
//             control={form.control}
//             name="jamSelesai"
//             render={({ field }) => (
//               <FormItem>
//                 <FormLabel>Jam Selesai (Privat)</FormLabel>
//                 <FormControl>
//                   <Input type="time" {...field} />
//                 </FormControl>
//                 <FormMessage />
//               </FormItem>
//             )}
//           />
//         </div>
//       )}
//     </form>
//   );
// }

"use client";

import React, { useMemo } from "react";
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
import { Info, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { useKelas } from "@/hooks/useKelas";
import { useRuang } from "@/hooks/useRuang";
import { useJam } from "@/hooks/useJam";
import { Hari, TipeKelas } from "@prisma/client";
import type { TypeServerCreateBulkJadwalSchema } from "@/types/jadwalKelas.type";

// Tipe Schema Form Wrapper
type FormSchemaType = {
  schedules: TypeServerCreateBulkJadwalSchema;
};

// =========================================================
// 1. KOMPONEN CHILD (ITEM JADWAL) - Memindahkan Logic Row ke sini
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
  // --- DATA FETCHING (Cached by React Query) ---
  // Aman dipanggil di sini karena ini adalah Komponen React
  const { data: dataRuang, isLoading: isLoadingRuang } = useRuang();
  const { dataJamTetap: dataJamSlot, isLoadingJamTetap: isLoadingJamSlot } =
    useJam();
  const { dataKelasAktif: dataKelas } = useKelas();

  // --- WATCH FIELD KHUSUS ROW INI ---
  const currentRuangId = useWatch({
    control,
    name: `schedules.${index}.ruangId`,
  });
  const currentTipeJam = useWatch({
    control,
    name: `schedules.${index}.tipeJam`,
  });
  const currentJamTetapId = useWatch({
    control,
    name: `schedules.${index}.jamSlotTetapId`,
  });

  // --- LOGIC ---

  // Info Tipe Kelas (Reguler/Privat) berdasarkan kelas yang dipilih di Parent
  const selectedKelasInfo = useMemo(
    () => dataKelas?.find((k) => k.id === firstItemKelasId),
    [dataKelas, firstItemKelasId],
  );

  // Tentukan Cabang berdasarkan Ruang yang dipilih di row ini
  const currentCabangId = useMemo(() => {
    return dataRuang?.find((r) => r.id === currentRuangId)?.cabangId;
  }, [dataRuang, currentRuangId]);

  // Filter Jam Slot berdasarkan Cabang Ruang tersebut
  const filteredJamSlots = useMemo(() => {
    if (!currentCabangId || !dataJamSlot) return [];
    return dataJamSlot.filter((slot) => slot.cabangId === currentCabangId);
  }, [currentCabangId, dataJamSlot]);

  // Handler perubahan radio jam
  const handleJamSelectionChange = (value: string) => {
    if (value === "CUSTOM") {
      setValue(`schedules.${index}.tipeJam`, "CUSTOM");
      setValue(`schedules.${index}.jamSlotTetapId`, undefined);
    } else {
      setValue(`schedules.${index}.tipeJam`, "TETAP");
      setValue(`schedules.${index}.jamSlotTetapId`, value);
      // Reset jam custom
      setValue(`schedules.${index}.jamMulai`, undefined);
      setValue(`schedules.${index}.jamSelesai`, undefined);
    }
    // Trigger validasi ulang
    void trigger(`schedules.${index}`);
  };

  // Tentukan value radio group saat ini untuk UI
  const currentRadioValue =
    currentTipeJam === "CUSTOM" ? "CUSTOM" : (currentJamTetapId ?? undefined);

  return (
    <Card className="relative border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">
            Jadwal Pertemuan #{index + 1}
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

        {/* Pilih Waktu (Jam) */}
        <FormItem>
          <FormLabel>Pilih Waktu</FormLabel>
          {!currentRuangId ? (
            <Alert variant="destructive" className="py-2">
              <Info className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Pilih Ruang dulu untuk melihat slot jam.
              </AlertDescription>
            </Alert>
          ) : isLoadingJamSlot ? (
            <Skeleton className="h-20 w-full" />
          ) : (
            <RadioGroup
              value={currentRadioValue}
              onValueChange={handleJamSelectionChange}
              className="grid grid-cols-1 gap-2"
            >
              {/* Slot Tetap */}
              {filteredJamSlots.length > 0 ? (
                filteredJamSlots.map((slot) => (
                  <FormItem
                    key={slot.id}
                    className="hover:bg-accent flex items-center space-y-0 space-x-3 rounded-md border p-2"
                  >
                    <FormControl>
                      <>
                        <RadioGroupItem value={slot.id} />
                        <Label className="flex-1 cursor-pointer font-normal">
                          {slot.namaSlot} ({slot.jamMulai} - {slot.jamSelesai})
                        </Label>
                      </>
                    </FormControl>
                  </FormItem>
                ))
              ) : (
                <p className="text-muted-foreground text-xs italic">
                  Tidak ada slot reguler di cabang ini.
                </p>
              )}

              {/* Slot Custom */}
              <FormItem className="hover:bg-accent flex items-center space-y-0 space-x-3 rounded-md border p-2">
                <FormControl>
                  <RadioGroupItem value="CUSTOM" />
                </FormControl>
                <div className="flex flex-1 items-center justify-between">
                  <Label className="cursor-pointer font-normal">
                    Input Manual (Privat/Custom)
                  </Label>
                  {selectedKelasInfo?.tipe === TipeKelas.REGULAR && (
                    <Badge variant="secondary" className="text-[10px]">
                      Hanya Privat
                    </Badge>
                  )}
                </div>
              </FormItem>
            </RadioGroup>
          )}
          {/* Pesan Error Tipe Jam */}
          <FormField
            control={control}
            name={`schedules.${index}.tipeJam`}
            render={() => <FormMessage />}
          />
        </FormItem>

        {/* Input Manual (Kondisional) */}
        {currentTipeJam === "CUSTOM" && (
          <div className="bg-muted/30 grid grid-cols-2 gap-4 rounded-md border p-3">
            <FormField
              control={control}
              name={`schedules.${index}.jamMulai`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Mulai</FormLabel>
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
                  <FormLabel className="text-xs">Selesai</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}
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
      enableQueryGetAll: false,
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
    });
  };

  const handleAddSchedule = () => {
    // Tambahkan item baru. Kita pakai 'as any' sementara karena
    // tipe union Zod (TETAP vs CUSTOM) ketat, sedangkan state awal form bisa jadi partial.
    // Namun, kita set default 'TETAP' agar lebih aman.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    append({
      kelasId: firstItemKelasId || "",
      ruangId: "",
      hari: undefined as unknown as Hari, // Paksa undefined agar user memilih
      tipeJam: "TETAP",
      jamSlotTetapId: "",
      jamMulai: undefined,
      jamSelesai: undefined,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
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
                {kelas.kodeKelas}
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
          className="w-full border"
          onClick={handleAddSchedule}
        >
          <Plus className="mr-2 h-4 w-4" />
          Tambah Jadwal Hari Lain
        </Button>
      )}
    </form>
  );
}
