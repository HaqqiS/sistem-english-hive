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
import { Textarea } from "@/components/ui/textarea";
import { useCabang } from "@/hooks/useCabang";
import { useMurid } from "@/hooks/useMurid";
import MuridForm from "../views/admin/murid/form/murid-form";

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
              <MuridForm onSubmit={onSubmit} />

              <div className="mt-4">
                <Button
                  type="submit"
                  size="sm"
                  className="w-full"
                  disabled={mutations.create.isPending}
                  onClick={form.handleSubmit(onSubmit)}
                >
                  {mutations.create.isPending
                    ? "Mengirim..."
                    : "Kirim Pendaftaran"}
                </Button>
              </div>
            </Form>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
