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
      className="bg-muted/30 px-4 py-16 sm:px-6 lg:px-8 lg:py-24"
    >
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          {/* Left Image */}
          <div className="relative h-96 min-h-96 lg:h-full">
            <Image
              src="/team-photo-classroom-environment-english-learning.jpg"
              alt="English Hive Team"
              width={400}
              height={400}
              className="h-full w-full rounded-2xl object-cover shadow-lg"
            />
            <div className="bg-primary text-primary-foreground absolute -right-4 -bottom-4 rounded-lg px-6 py-3 font-semibold shadow-lg">
              5+ Tahun Berpengalaman
            </div>
          </div>

          {/* Right Content */}
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-balance sm:text-4xl lg:text-5xl">
              Tentang English Hive
            </h2>

            <div className="text-muted-foreground space-y-4">
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
              <p>
                Kami percaya bahwa setiap orang memiliki potensi untuk menguasai
                bahasa Inggris dengan pendekatan yang tepat, lingkungan yang
                mendukung, dan praktik yang konsisten.
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 pt-6">
              {stats.map((stat, index) => (
                <Card key={index} className="bg-background">
                  <CardContent className="pt-6">
                    <div className="text-primary text-2xl font-bold">
                      {stat.number}
                    </div>
                    <div className="text-muted-foreground text-sm">
                      {stat.label}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Button size="lg" variant="outline" className="mt-6 bg-transparent">
              Pelajari Lebih Lanjut
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
