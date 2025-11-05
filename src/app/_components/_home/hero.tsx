"use client";

import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useIsMobile } from "@/hooks/use-mobile";

export default function Hero() {
  const isMobile = useIsMobile();
  return (
    // Using min-h-[calc(100vh-4rem)] to account for navbar (h-16 = 4rem)
    <section className="bg-background relative flex min-h-[calc(100vh-4rem)] flex-col justify-between overflow-hidden">
      {/* Hero Content */}
      <div className="flex flex-1 items-center px-4 py-6 sm:px-6 lg:px-8 lg:py-0">
        <div className="mx-auto w-full max-w-7xl">
          <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2">
            {/* Left Content */}
            <div className="animate-fade-in space-y-4">
              <h1 className="text-3xl leading-tight font-bold text-balance sm:text-4xl lg:text-5xl">
                <span className="from-primary to-secondary bg-linear-to-r bg-clip-text text-transparent">
                  Belajar Bahasa Inggris
                </span>{" "}
                Jadi Seru dan Percaya Diri!
              </h1>

              <p className="text-muted-foreground line-clamp-3 max-w-lg text-base lg:text-lg">
                Tingkatkan kemampuan bahasa inggris dengan cara fun, dan
                interaktif. Ratusan siswa telah merasakan transformasi belajar
                bersama kami.
              </p>

              <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                <a href="#registration">
                  <Button size="sm" className="group gap-2">
                    Daftar Sekarang
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </a>
                <Button size="sm" variant="outline">
                  Pelajari Lebih Lanjut
                </Button>
              </div>

              <div className="text-muted-foreground flex items-center gap-2 pt-2 text-xs">
                <div className="bg-primary h-2 w-2 rounded-full" />
                <span>500+ siswa telah bergabung</span>
              </div>
            </div>

            {/* Right Content - Hero Image */}

            {!isMobile && (
              <div className="animate-float relative max-h-40 md:h-full">
                <div className="from-primary/20 to-secondary/20 absolute inset-0 rounded-3xl bg-linear-to-br blur-3xl" />
                <div className="relative flex h-full items-center justify-center">
                  <Image
                    src="/professional-female-student-in-pink-shirt-with-bac.png"
                    alt="Student learning English"
                    width={350}
                    height={350}
                    className="rounded-2xl object-cover shadow-2xl"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Marquee Banner */}
      <div className="bg-secondary relative left-1/2 w-screen shrink-0 -translate-x-1/2 overflow-hidden py-5">
        <div className="relative flex overflow-x-hidden">
          <div className="animate-marquee flex gap-8 whitespace-nowrap">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-8">
                <span className="text-secondary-foreground text-xs font-bold tracking-wider uppercase sm:text-sm">
                  ✨ FLUENT NOW
                </span>
                <span className="text-secondary-foreground text-xs font-bold tracking-wider uppercase sm:text-sm">
                  CONFIDENT FOREVER
                </span>
                <span className="text-secondary-foreground text-xs font-bold tracking-wider uppercase sm:text-sm">
                  WITH ENGLISH HIVE
                </span>
              </div>
            ))}
          </div>
        </div>
        <style jsx>{`
          @keyframes marquee {
            0% {
              transform: translateX(0);
            }
            100% {
              transform: translateX(-33.333%);
            }
          }
          .animate-marquee {
            animation: marquee 20s linear infinite;
          }
        `}</style>
      </div>
    </section>
  );
}
