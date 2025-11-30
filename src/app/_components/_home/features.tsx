"use client";

import {
  Users,
  BookOpen,
  Award,
  Clock,
  MessageCircle,
  Smartphone,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion, type Variants } from "framer-motion";
import { ScrollAnimation } from "@/app/_components/shared/scroll-animation";

const features = [
  {
    icon: Users,
    title: "Kelas Interaktif",
    description:
      "Belajar dalam kelompok kecil dengan interaksi maksimal dan perhatian personal.",
    color: "text-primary",
  },
  {
    icon: BookOpen,
    title: "Materi Terstruktur",
    description:
      "Kurikulum yang dirancang sistematis dari level dasar hingga mahir.",
    color: "text-secondary",
  },
  {
    icon: Award,
    title: "Sertifikat Resmi",
    description:
      "Dapatkan sertifikat penyelesaian yang diakui untuk menunjang karir.",
    color: "text-primary",
  },
  {
    icon: Clock,
    title: "Jadwal Fleksibel",
    description:
      "Pilih waktu belajar yang sesuai dengan aktivitas Anda (Pagi/Siang/Malam).",
    color: "text-secondary",
  },
  {
    icon: MessageCircle,
    title: "Speaking Practice",
    description:
      "Fokus pada kemampuan berbicara dengan sesi conversation club.",
    color: "text-primary",
  },
  {
    icon: Smartphone,
    title: "Platform Online",
    description:
      "Akses materi dan latihan kapan saja melalui platform user-friendly.",
    color: "text-secondary",
  },
];

// Varian item untuk animasi stagger (child animation)
const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 50 } },
};

export default function Features() {
  return (
    <section className="bg-background py-16 sm:py-24">
      <div className="mx-auto w-full max-w-7xl px-6 lg:px-8">
        <ScrollAnimation variant="fadeUp" className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold text-balance sm:text-4xl lg:text-5xl">
            Mengapa Memilih English Hive?
          </h2>
          <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
            Metode pembelajaran yang terbukti efektif dan menyenangkan
          </p>
        </ScrollAnimation>

        <ScrollAnimation
          variant="stagger"
          className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
        >
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div key={index} variants={itemVariants}>
                <Card className="border-t-primary h-full border-t-4 transition-all duration-300 hover:scale-105 hover:shadow-lg">
                  <CardHeader>
                    <Icon className={`mb-2 h-8 w-8 ${feature.color}`} />
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </ScrollAnimation>
      </div>
    </section>
  );
}
