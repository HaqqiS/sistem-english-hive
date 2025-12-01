"use client";

import { useState } from "react";
import { useFormContext } from "react-hook-form";
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
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Gender } from "@prisma/client";
import { useCabang } from "@/hooks/useCabang";
import type { TypeClientRegisterMuridSchema } from "@/types/murid.type";
import { cn } from "@/lib/utils"; // Import cn for cleaner class merging

interface MuridFormProps {
  onSubmit: (data: TypeClientRegisterMuridSchema) => void;
  idPrefix?: string;
  forceStacked?: boolean; // New prop to force 1 column layout
}

export default function MuridForm({
  onSubmit,
  idPrefix = "murid",
  forceStacked = false, // Default false (Responsive)
}: MuridFormProps) {
  const form = useFormContext<TypeClientRegisterMuridSchema>();
  const { dataList: dataCabang, isLoading: isLoadingCabang } = useCabang({
    enableQuery: false,
    enableQueryList: true,
  });

  const [isOther, setIsOther] = useState(
    form.getValues("sumberInfo") === "Other" ||
      (form.getValues("sumberInfo") &&
        !["Instagram", "WhatsApp", "Teman"].includes(
          form.getValues("sumberInfo"),
        )),
  );
  const [otherValue, setOtherValue] = useState("");

  // Define grid class based on props
  // If forceStacked is true: always 1 column
  // If false: 1 column on mobile, 2 columns on medium screens and up
  const gridColsClass = forceStacked
    ? "grid-cols-1"
    : "grid-cols-1 md:grid-cols-2";

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      {/* Container utama: 2 kolom di desktop untuk layout form besar, 1 kolom jika forceStacked */}
      <div className={cn("grid gap-4", gridColsClass)}>
        <div className="col-span-1 space-y-4">
          <FormField
            control={form.control}
            name="namaLengkap"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm">Nama Lengkap</FormLabel>
                <FormControl>
                  <Input placeholder="Masukkan nama lengkap" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm">Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="email@example.com"
                    {...field}
                  />
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
                <FormLabel className="text-sm">Alamat</FormLabel>
                <FormControl>
                  <Input placeholder="Masukkan alamat" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="gender"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm">Jenis Kelamin</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Pilih jenis kelamin" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={Gender.LAKI_LAKI}>Laki-laki</SelectItem>
                    <SelectItem value={Gender.PEREMPUAN}>Perempuan</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Inner Grid: Umur & WA */}
          <div className={cn("grid gap-2", gridColsClass)}>
            <FormField
              control={form.control}
              name="umur"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">Umur</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Umur"
                      {...field}
                      onChange={(e) => field.onChange(e.target.valueAsNumber)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="noWA"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">No. WA</FormLabel>
                  <FormControl>
                    <Input type="tel" placeholder="08..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Inner Grid: Program & Cabang */}
          <div className={cn("grid gap-2", gridColsClass)}>
            <FormField
              control={form.control}
              name="pilihanProgram"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">Pilihan Program</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Pilih program" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Reguler</SelectLabel>
                        <SelectItem value="regulerPG">
                          Program Reguler (PG)
                        </SelectItem>
                        <SelectItem value="regulerTK">
                          Program Reguler (TK)
                        </SelectItem>
                        <SelectItem value="regulerSD">
                          Program Reguler (SD)
                        </SelectItem>
                        <SelectItem value="regulerSMP">
                          Program Reguler (SMP)
                        </SelectItem>
                        <SelectItem value="regulerSMA">
                          Program Reguler (SMA)
                        </SelectItem>
                      </SelectGroup>
                      <SelectGroup>
                        <SelectLabel>Privat</SelectLabel>
                        <SelectItem value="privatSekolah">
                          Program Privat (Sekolah)
                        </SelectItem>
                        <SelectItem value="privatDewasa">
                          Program Privat (Dewasa/Kerja)
                        </SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="cabangId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">Pilih Cabang</FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isLoadingCabang}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue
                          placeholder={
                            isLoadingCabang ? "Loading..." : "Pilih Cabang"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {dataCabang?.map((items) => (
                          <SelectItem key={items.id} value={items.id}>
                            {items.namaCabang}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="col-span-1 space-y-4">
          <FormField
            control={form.control}
            name="asalSekolah"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm">Asal Sekolah</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    placeholder="Masukkan asal sekolah"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="kelasSekolah"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm">Kelas Sekolah</FormLabel>
                <FormControl>
                  <Input type="text" placeholder="Kelas saat ini" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="jamPulang"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm">Jam Pulang Sekolah</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Contoh: Senin-Jumat: 13.00"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="sumberInfo"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm">Sumber Informasi</FormLabel>
                <FormControl>
                  <div className="space-y-2">
                    <RadioGroup
                      value={isOther ? "Other" : field.value}
                      onValueChange={(value) => {
                        if (value === "Other") {
                          setIsOther(true);
                          field.onChange(otherValue);
                        } else {
                          setIsOther(false);
                          field.onChange(value);
                        }
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <RadioGroupItem
                          value="Instagram"
                          id={`${idPrefix}-r1`}
                        />
                        <Label htmlFor={`${idPrefix}-r1`}>Instagram</Label>
                      </div>
                      <div className="flex items-center gap-3">
                        <RadioGroupItem
                          value="WhatsApp"
                          id={`${idPrefix}-r2`}
                        />
                        <Label htmlFor={`${idPrefix}-r2`}>WhatsApp</Label>
                      </div>
                      <div className="flex items-center gap-3">
                        <RadioGroupItem value="Teman" id={`${idPrefix}-r3`} />
                        <Label htmlFor={`${idPrefix}-r3`}>Teman</Label>
                      </div>
                      <div className="flex items-center gap-3">
                        <RadioGroupItem value="Other" id={`${idPrefix}-r4`} />
                        <Label htmlFor={`${idPrefix}-r4`}>Other</Label>
                      </div>
                    </RadioGroup>

                    {isOther && (
                      <Input
                        placeholder="Masukkan sumber informasi lain..."
                        value={otherValue}
                        onChange={(e) => {
                          const val = e.target.value;
                          setOtherValue(val);
                          field.onChange(val);
                        }}
                        className="mt-2"
                      />
                    )}
                  </div>
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
