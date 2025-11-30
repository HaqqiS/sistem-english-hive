"use client";

import { motion } from "framer-motion";
import { Check, Users, User } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollAnimation } from "@/app/_components/shared/scroll-animation";

const pricingOptions = [
  {
    title: "Kelas Regular",
    description: "Belajar seru dan interaktif bersama teman-teman sebaya.",
    icon: Users,
    features: [
      "Maksimal 10 Siswa per kelas",
      "Interaksi sosial yang aktif",
      "Jadwal tetap & terstruktur",
      "Biaya lebih terjangkau",
      "Kurikulum standar English Hive",
      "Sertifikat penyelesaian",
    ],
    highlight: false,
    buttonText: "Daftar Regular",
  },
  {
    title: "Kelas Private",
    description:
      "Fokus intensif dengan materi yang disesuaikan kebutuhan Anda.",
    icon: User,
    features: [
      "1-on-1 dengan Tutor (Eksklusif)",
      "Materi Customized (Sesuai target)",
      "Jadwal Fleksibel (Sesuai kesepakatan)",
      "Progress monitoring intensif",
      "Bisa request fokus materi (Cth: Speaking)",
      "Sertifikat & Laporan personal",
    ],
    highlight: true,
    buttonText: "Daftar Private",
  },
];

export default function Pricing() {
  return (
    <section className="bg-muted/30 py-20" id="pricing">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <ScrollAnimation
          variant="fadeUp"
          className="mx-auto mb-16 max-w-2xl text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Pilih Tipe Kelas Anda
          </h2>
          <p className="text-muted-foreground mt-4 text-lg">
            Sesuaikan metode belajar dengan kebutuhan dan preferensi putra-putri
            Anda.
          </p>
        </ScrollAnimation>

        <div className="mx-auto grid max-w-4xl grid-cols-1 gap-8 md:grid-cols-2">
          {pricingOptions.map((option, index) => {
            const Icon = option.icon;
            return (
              <ScrollAnimation
                key={index}
                variant="zoomIn"
                delay={index * 0.2}
                className="h-full"
              >
                <Card
                  className={`relative flex h-full flex-col ${option.highlight ? "border-primary scale-105 shadow-xl" : "border-border"}`}
                >
                  {option.highlight && (
                    <div className="absolute -top-4 right-0 left-0 flex justify-center">
                      <Badge className="bg-primary text-primary-foreground px-4 py-1">
                        Paling Fleksibel
                      </Badge>
                    </div>
                  )}
                  <CardHeader>
                    <div className="mb-2 flex items-center gap-3">
                      <div
                        className={`rounded-full p-2 ${option.highlight ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}
                      >
                        <Icon className="h-6 w-6" />
                      </div>
                      <CardTitle className="text-2xl">{option.title}</CardTitle>
                    </div>
                    <CardDescription className="text-base">
                      {option.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <ul className="space-y-3">
                      {option.features.map((feature, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-3 text-sm"
                        >
                          <Check className="h-5 w-5 shrink-0 text-green-500" />
                          <span className="text-muted-foreground">
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button
                      className="w-full"
                      variant={option.highlight ? "default" : "outline"}
                      size="lg"
                      asChild
                    >
                      <a href="#registration">{option.buttonText}</a>
                    </Button>
                  </CardFooter>
                </Card>
              </ScrollAnimation>
            );
          })}
        </div>
      </div>
    </section>
  );
}
