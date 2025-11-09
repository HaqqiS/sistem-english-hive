"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  RegisterMuridSchema,
  type TypeClientRegisterMuridSchema,
} from "@/types/murid.type";
import { Gender } from "@prisma/client";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useMurid } from "../../../hooks/useMurid";
import { useCabang } from "../../../hooks/useCabang";
import { Textarea } from "@/components/ui/textarea";

export default function Registration() {
  const { mutations } = useMurid({
    onSuccessCreate: () => {
      form.reset();
    },
  });
  const { data: dataCabang, isLoading: isLoadingCabang } = useCabang();

  const form = useForm<TypeClientRegisterMuridSchema>({
    resolver: zodResolver(RegisterMuridSchema),
    defaultValues: {
      namaLengkap: "",
      email: "",
      alamat: "",
      gender: undefined,
      umur: undefined,
      asalSekolah: "",
      kelasSekolah: "",
      jamPulang: "",
      noWA: "",
      cabangId: "",
      pilihanProgram: "",
      sumberInfo: "",
    },
  });

  const [isOther, setIsOther] = useState(
    form.getValues("sumberInfo") === "Other",
  );
  const [otherValue, setOtherValue] = useState("");

  function onSubmit(data: TypeClientRegisterMuridSchema) {
    mutations.create.mutate(data);
  }

  return (
    <section
      id="registration"
      className="bg-muted/30 flex min-h-screen items-center px-4 py-12 sm:px-6 lg:px-8 lg:py-16"
    >
      <div className="mx-auto w-full max-w-7xl">
        <div className="mb-6 text-center">
          <h2 className="mb-2 text-3xl font-bold text-balance sm:text-4xl lg:text-4xl">
            Daftar Sekarang
          </h2>
          <p className="text-muted-foreground text-sm">
            Isi form di bawah ini dan tim kami akan menghubungi Anda dalam 1x24
            jam
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            {/* {submitSuccess && (
              <div className="bg-primary/10 border-primary text-primary mb-4 rounded-lg border p-3 text-sm">
                Terima kasih! Pendaftaran Anda telah kami terima. Tim kami akan
                segera menghubungi Anda.
              </div>
            )} */}

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="col-span-1 space-y-4">
                    <FormField
                      control={form.control}
                      name="namaLengkap"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm">
                            Nama Lengkap
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Masukkan nama lengkap Anda"
                              {...field}
                            />
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
                              type="text"
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
                            <Input
                              placeholder="Masukkan alamat Anda"
                              {...field}
                            />
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
                          <FormLabel className="text-sm">
                            Jenis Kelamin
                          </FormLabel>
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
                              <SelectItem value={Gender.LAKI_LAKI}>
                                Laki-laki
                              </SelectItem>
                              <SelectItem value={Gender.PEREMPUAN}>
                                Perempuan
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 space-x-2">
                      <FormField
                        control={form.control}
                        name="umur"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">Umur</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="Masukkan umur Anda"
                                {...field}
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
                              <Input
                                type="number"
                                placeholder="Masukkan No. WA Anda"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid grid-cols-2 space-x-2">
                      <FormField
                        control={form.control}
                        name="pilihanProgram"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">
                              Pilihan Program
                            </FormLabel>
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
                                  <SelectItem value="regulerDewasa">
                                    Program Reguler (Dewasa/Kerja)
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
                            <FormLabel>Pilih Cabang</FormLabel>
                            <FormControl>
                              <Select
                                onValueChange={field.onChange}
                                value={field.value}
                                disabled={isLoadingCabang}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue
                                    placeholder={
                                      isLoadingCabang
                                        ? "Loading..."
                                        : "Pilih Cabang"
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
                          <FormLabel className="text-sm">
                            Asal Sekolah
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="text"
                              placeholder="Masukkan asal sekolah Anda"
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
                          <FormLabel className="text-sm">Kelas </FormLabel>
                          <FormControl>
                            <Input
                              type="text"
                              placeholder="Masukkan kelas Anda"
                              {...field}
                            />
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
                          <FormLabel className="text-sm">
                            Jam Pulang Sekolah
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Senin-Jumat: 13.00, Sabtu: 12.00"
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
                      render={({ field }) => {
                        return (
                          <FormItem>
                            <FormLabel className="text-sm">
                              Sumber Informasi
                            </FormLabel>
                            <FormControl>
                              <div className="space-y-2">
                                <RadioGroup
                                  value={field.value}
                                  onValueChange={(value) => {
                                    field.onChange(value);
                                    setIsOther(value === "Other");
                                  }}
                                >
                                  <div className="flex items-center gap-3">
                                    <RadioGroupItem value="Instagram" id="r1" />
                                    <Label htmlFor="r1">Instagram</Label>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <RadioGroupItem value="WhatsApp" id="r2" />
                                    <Label htmlFor="r2">WhatsApp</Label>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <RadioGroupItem value="Teman" id="r3" />
                                    <Label htmlFor="r3">Teman</Label>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <RadioGroupItem value="Other" id="r4" />
                                    <Label htmlFor="r4">Other</Label>
                                  </div>
                                </RadioGroup>

                                {isOther && (
                                  <Input
                                    placeholder="Masukkan sumber informasi lain..."
                                    value={otherValue}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setOtherValue(val);
                                      field.onChange(val); // kirim ke React Hook Form
                                    }}
                                    className="mt-2"
                                  />
                                )}
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        );
                      }}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  size="sm"
                  className="w-full"
                  disabled={mutations.create.isPending}
                >
                  {mutations.create.isPending
                    ? "Mengirim..."
                    : "Kirim Pendaftaran"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
