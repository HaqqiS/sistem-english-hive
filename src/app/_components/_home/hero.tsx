"use client";

import { ArrowRight } from "lucide-react";
import { Button } from "@/app/_components/ui/button";
import Image from "next/image";

export default function Hero() {
  return (
    <section className="bg-background relative overflow-hidden px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          {/* Left Content */}
          <div className="animate-fade-in space-y-6">
            <h1 className="text-4xl leading-tight font-bold text-balance sm:text-5xl lg:text-6xl">
              <span className="from-primary to-secondary bg-gradient-to-r bg-clip-text text-transparent">
                Belajar Bahasa Inggris
              </span>{" "}
              Jadi Seru dan Percaya Diri!
            </h1>

            <p className="text-muted-foreground max-w-lg text-lg">
              Tingkatkan kemampuan bahasa inggris dengan cara fun, dan
              interaktif. Ratusan siswa telah merasakan transformasi belajar
              bersama kami.
            </p>

            <div className="flex flex-col gap-4 pt-4 sm:flex-row">
              <Button size="lg" className="group gap-2">
                Daftar Sekarang
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
              <Button size="lg" variant="outline">
                Pelajari Lebih Lanjut
              </Button>
            </div>

            <div className="text-muted-foreground flex items-center gap-2 pt-4 text-sm">
              <div className="bg-primary h-2 w-2 rounded-full" />
              <span>500+ siswa telah bergabung</span>
            </div>
          </div>

          {/* Right Content - Hero Image */}
          <div className="animate-float relative h-96 min-h-96 lg:h-full">
            <div className="from-primary/20 to-secondary/20 absolute inset-0 rounded-3xl bg-gradient-to-br blur-3xl" />
            <div className="relative flex h-full items-center justify-center">
              <Image
                src="/professional-female-student-in-pink-shirt-with-bac.jpg"
                alt="Student learning English"
                width={400}
                height={400}
                className="rounded-2xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
