import {
  Users,
  BookOpen,
  Award,
  Clock,
  MessageCircle,
  Smartphone,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/_components/ui/card";

const features = [
  {
    icon: Users,
    title: "Kelas Interaktif",
    description:
      "Belajar dalam kelompok kecil dengan interaksi maksimal dan perhatian personal dari tutor berpengalaman",
    color: "text-primary",
  },
  {
    icon: BookOpen,
    title: "Materi Terstruktur",
    description:
      "Kurikulum yang dirancang sistematis dari level dasar hingga mahir dengan tracking progress yang jelas",
    color: "text-secondary",
  },
  {
    icon: Award,
    title: "Sertifikat Resmi",
    description:
      "Dapatkan sertifikat penyelesaian yang diakui untuk menunjang karir dan pendidikan Anda",
    color: "text-primary",
  },
  {
    icon: Clock,
    title: "Jadwal Fleksibel",
    description:
      "Pilih waktu belajar yang sesuai dengan aktivitas Anda, tersedia kelas pagi, siang, dan malam",
    color: "text-secondary",
  },
  {
    icon: MessageCircle,
    title: "Speaking Practice",
    description:
      "Fokus pada kemampuan berbicara dengan sesi conversation club dan role-play scenarios",
    color: "text-primary",
  },
  {
    icon: Smartphone,
    title: "Platform Online",
    description:
      "Akses materi dan latihan kapan saja melalui platform pembelajaran online yang user-friendly",
    color: "text-secondary",
  },
];

export default function Features() {
  return (
    <section className="bg-background px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold text-balance sm:text-4xl lg:text-5xl">
            Mengapa Memilih English Hive?
          </h2>
          <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
            Metode pembelajaran yang terbukti efektif dan menyenangkan
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card
                key={index}
                className="border-t-primary border-t-4 transition-all duration-300 hover:scale-105 hover:shadow-lg"
              >
                <CardHeader>
                  <Icon className={`mb-2 h-8 w-8 ${feature.color}`} />
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
