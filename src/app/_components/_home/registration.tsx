"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
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

const registrationSchema = z.object({
  fullName: z.string().min(3, "Nama minimal 3 karakter"),
  email: z.string().email("Email tidak valid"),
  phone: z.string().regex(/^08\d{8,}$/, "Nomor WhatsApp Indonesia tidak valid"),
  program: z.string().min(1, "Pilih program"),
  level: z.string().min(1, "Pilih level"),
  schedule: z.string().min(1, "Pilih jadwal"),
  message: z.string().optional(),
});

type RegistrationFormData = z.infer<typeof registrationSchema>;

export default function Registration() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const form = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      program: "",
      level: "",
      schedule: "",
      message: "",
    },
  });

  async function onSubmit(data: RegistrationFormData) {
    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log("Form data:", data);
      setSubmitSuccess(true);
      form.reset();
      setTimeout(() => setSubmitSuccess(false), 5000);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section
      id="registration"
      className="bg-muted/30 px-4 py-16 sm:px-6 lg:px-8 lg:py-24"
    >
      <div className="mx-auto max-w-2xl">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold text-balance sm:text-4xl lg:text-5xl">
            Daftar Sekarang
          </h2>
          <p className="text-muted-foreground text-lg">
            Isi form di bawah ini dan tim kami akan menghubungi Anda dalam 1x24
            jam
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            {submitSuccess && (
              <div className="bg-primary/10 border-primary text-primary mb-6 rounded-lg border p-4">
                Terima kasih! Pendaftaran Anda telah kami terima. Tim kami akan
                segera menghubungi Anda.
              </div>
            )}

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama Lengkap</FormLabel>
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
                      <FormLabel>Email</FormLabel>
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
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>No. WhatsApp</FormLabel>
                      <FormControl>
                        <Input placeholder="08xxxxxxxxxx" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="program"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Program yang Diminati</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih program" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="general">
                            General English
                          </SelectItem>
                          <SelectItem value="business">
                            Business English
                          </SelectItem>
                          <SelectItem value="toefl">
                            TOEFL/IELTS Preparation
                          </SelectItem>
                          <SelectItem value="kids">Kids & Teens</SelectItem>
                          <SelectItem value="konsultasi">
                            Belum yakin, ingin konsultasi dulu
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="level"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Level Bahasa Inggris Saat Ini</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="beginner">
                            Beginner (Pemula)
                          </SelectItem>
                          <SelectItem value="elementary">
                            Elementary (Dasar)
                          </SelectItem>
                          <SelectItem value="intermediate">
                            Intermediate (Menengah)
                          </SelectItem>
                          <SelectItem value="advanced">
                            Advanced (Mahir)
                          </SelectItem>
                          <SelectItem value="unknown">Tidak tahu</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="schedule"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preferensi Jadwal</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih jadwal" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="pagi">
                            Pagi (08:00 - 12:00)
                          </SelectItem>
                          <SelectItem value="siang">
                            Siang (12:00 - 16:00)
                          </SelectItem>
                          <SelectItem value="sore">
                            Sore (16:00 - 19:00)
                          </SelectItem>
                          <SelectItem value="malam">
                            Malam (19:00 - 21:00)
                          </SelectItem>
                          <SelectItem value="weekend">Weekend</SelectItem>
                          <SelectItem value="fleksibel">Fleksibel</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pesan / Pertanyaan (Opsional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Ada yang ingin Anda tanyakan?"
                          rows={4}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Mengirim..." : "Kirim Pendaftaran"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
