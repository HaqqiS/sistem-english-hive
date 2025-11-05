import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";

const stats = [
  { number: "500+", label: "Siswa Aktif" },
  { number: "10+", label: "Tutor Berpengalaman" },
  { number: "95%", label: "Tingkat Kepuasan" },
  { number: "5+", label: "Tahun Berpengalaman" },
];

export default function About() {
  return (
    <section
      id="about"
      className="bg-muted/30 flex min-h-screen items-center px-4 py-12 sm:px-6 lg:px-8 lg:py-16"
    >
      <div className="mx-auto w-full max-w-7xl">
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2">
          <div className="relative h-64 lg:h-80">
            <Image
              src="/team-photo-classroom-environment-english-learning.jpg"
              alt="English Hive Team"
              width={400}
              height={400}
              className="h-full w-full rounded-2xl object-cover shadow-lg"
            />
            <div className="bg-primary text-primary-foreground absolute -right-4 -bottom-4 rounded-lg px-4 py-2 text-sm font-semibold shadow-lg">
              5+ Tahun Berpengalaman
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-3xl font-bold text-balance sm:text-4xl lg:text-4xl">
              Tentang English Hive
            </h2>

            <div className="text-muted-foreground space-y-3 text-sm">
              <p>
                English Hive adalah lembaga kursus bahasa Inggris yang
                berdedikasi untuk membantu siswa dari berbagai latar belakang
                mencapai kemampuan berbahasa Inggris yang optimal.
              </p>
              <p>
                Dengan metode pembelajaran yang inovatif dan tutor
                berkualifikasi internasional, kami telah membantu ratusan siswa
                meraih impian mereka dalam pendidikan dan karir global.
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3 pt-3">
              {stats.map((stat, index) => (
                <Card key={index} className="bg-background">
                  <CardContent className="pt-3">
                    <div className="text-primary text-xl font-bold">
                      {stat.number}
                    </div>
                    <div className="text-muted-foreground text-xs">
                      {stat.label}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Button size="sm" variant="outline" className="mt-3 bg-transparent">
              Pelajari Lebih Lanjut
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
