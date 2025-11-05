import { Globe, Briefcase, FileText, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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
    <section className="bg-background flex min-h-screen items-center px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      <div className="mx-auto w-full max-w-7xl">
        <div className="mb-8 text-center">
          <h2 className="mb-2 text-3xl font-bold text-balance sm:text-4xl lg:text-4xl">
            Program Kursus Kami
          </h2>
          <p className="text-muted-foreground mx-auto max-w-2xl text-base">
            Pilih program yang sesuai dengan kebutuhan dan level Anda
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {programs.map((program, index) => {
            const Icon = program.icon;
            return (
              <Card
                key={index}
                className="flex flex-col transition-all duration-300 hover:shadow-lg"
              >
                <CardHeader className="pb-3">
                  <div className="mb-2 flex items-start justify-between">
                    <Icon className="text-primary h-6 w-6" />
                    <Badge variant="secondary" className="text-xs">
                      {program.level}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">{program.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 space-y-3">
                  <p className="text-muted-foreground text-sm">
                    {program.description}
                  </p>

                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Durasi:</span>
                      <span className="font-semibold">{program.duration}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Frekuensi:</span>
                      <span className="font-semibold">{program.sessions}</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-foreground text-xs font-semibold">
                      Fitur:
                    </p>
                    <ul className="space-y-0.5">
                      {program.features.map((feature, i) => (
                        <li
                          key={i}
                          className="text-muted-foreground flex items-center gap-2 text-xs"
                        >
                          <span className="bg-primary h-1 w-1 rounded-full" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Button className="mt-2 w-full" size="sm">
                    Pilih Program
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
