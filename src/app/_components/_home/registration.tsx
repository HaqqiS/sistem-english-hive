"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import {
  RegisterMuridSchema,
  type TypeClientRegisterMuridSchema,
} from "@/types/murid.type";
import { useMurid } from "@/hooks/useMurid";
import MuridForm from "../views/admin/murid/form/murid-form";
import { ScrollAnimation } from "@/app/_components/shared/scroll-animation";

export default function Registration() {
  const { mutations } = useMurid({
    enableQuery: false,
    onSuccessCreate: () => {
      form.reset();
    },
  });

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

  function onSubmit(data: TypeClientRegisterMuridSchema) {
    mutations.create.mutate(data);
  }

  return (
    <section
      id="registration"
      className="bg-muted/30 flex min-h-screen items-center px-4 py-12 sm:px-6 lg:px-8 lg:py-16"
    >
      <div className="mx-auto w-full max-w-7xl">
        {/* <div className="mb-6 text-center">
          <h2 className="mb-2 text-3xl font-bold text-balance sm:text-4xl lg:text-4xl">
            Daftar Sekarang
          </h2>
          <p className="text-muted-foreground text-sm">
            Isi form di bawah ini dan tim kami akan menghubungi Anda dalam 1x24
            jam
          </p>
        </div> */}

        <ScrollAnimation variant="fadeUp" className="mb-10 text-center">
          <h2 className="mb-2 text-3xl font-bold sm:text-4xl">
            Daftar Sekarang
          </h2>
          <p className="text-muted-foreground">
            Isi form di bawah ini, tim kami akan menghubungi Anda dalam 1x24
            jam.
          </p>
        </ScrollAnimation>

        <ScrollAnimation variant="zoomIn" delay={0.2}>
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
        </ScrollAnimation>
      </div>
    </section>
  );
}
