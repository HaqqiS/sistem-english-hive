import { Globe, Briefcase, FileText, Users } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/_components/ui/card";
import { Badge } from "@/app/_components/ui/badge";
import { Button } from "@/app/_components/ui/button";

const programs = [
  {
    title: "General English",
    level: "Beginner - Advanced",
    description:
      "Program komprehensif untuk meningkatkan semua aspek bahasa: speaking, listening, reading, writing",
    duration: "3-6 bulan",
    sessions: "2x per minggu",
    icon: Globe,
    features: [
      "Grammar fundamentals",
      "Vocabulary building",
      "Conversation practice",
      "Writing skills",
    ],
  },
  {
    title: "Business English",
    level: "Intermediate - Advanced",
    description:
      "Fokus pada bahasa Inggris untuk dunia kerja, presentasi, meeting, dan komunikasi profesional",
    duration: "4 bulan",
    sessions: "2x per minggu",
    icon: Briefcase,
    features: [
      "Business vocabulary",
      "Email writing",
      "Presentation skills",
      "Negotiation",
    ],
  },
  {
    title: "TOEFL/IELTS Prep",
    level: "Intermediate - Advanced",
    description:
      "Persiapan intensif untuk tes TOEFL dan IELTS dengan strategi dan latihan soal",
    duration: "2-3 bulan",
    sessions: "3x per minggu",
    icon: FileText,
    features: [
      "Test strategies",
      "Practice tests",
      "Score improvement",
      "Time management",
    ],
  },
  {
    title: "Kids & Teens",
    level: "Elementary - High School",
    description:
      "Program khusus untuk anak dan remaja dengan metode fun learning dan game-based approach",
    duration: "Ongoing",
    sessions: "2x per minggu",
    icon: Users,
    features: [
      "Interactive games",
      "Story telling",
      "Songs & activities",
      "Age-appropriate content",
    ],
  },
];

export default function Programs() {
  return (
    <section className="bg-background px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold text-balance sm:text-4xl lg:text-5xl">
            Program Kursus Kami
          </h2>
          <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
            Pilih program yang sesuai dengan kebutuhan dan level Anda
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {programs.map((program, index) => {
            const Icon = program.icon;
            return (
              <Card
                key={index}
                className="flex flex-col transition-all duration-300 hover:shadow-lg"
              >
                <CardHeader>
                  <div className="mb-4 flex items-start justify-between">
                    <Icon className="text-primary h-8 w-8" />
                    <Badge variant="secondary">{program.level}</Badge>
                  </div>
                  <CardTitle className="text-2xl">{program.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 space-y-4">
                  <p className="text-muted-foreground">{program.description}</p>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Durasi:</span>
                      <span className="font-semibold">{program.duration}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Frekuensi:</span>
                      <span className="font-semibold">{program.sessions}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-foreground text-sm font-semibold">
                      Fitur:
                    </p>
                    <ul className="space-y-1">
                      {program.features.map((feature, i) => (
                        <li
                          key={i}
                          className="text-muted-foreground flex items-center gap-2 text-sm"
                        >
                          <span className="bg-primary h-1.5 w-1.5 rounded-full" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Button className="mt-4 w-full">Pilih Program</Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
