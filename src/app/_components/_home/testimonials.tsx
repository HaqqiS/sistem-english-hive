"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollAnimation } from "@/app/_components/shared/scroll-animation";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";

const testimonials = [
  {
    name: "Sarah Wijaya",
    role: "Marketing Manager",
    avatar: "SW",
    rating: 5,
    text: "English Hive benar-benar mengubah cara saya berbahasa Inggris. Dari yang awalnya malu dan tidak percaya diri, sekarang saya bisa presentasi di kantor dengan lancar!",
    program: "Business English",
  },
  {
    name: "Ahmad Fadli",
    role: "College Student",
    avatar: "AF",
    rating: 5,
    text: "Persiapan TOEFL saya di English Hive sangat membantu. Score saya naik dari 450 menjadi 550 dalam 3 bulan! Tutornya sabar dan materinya sangat terstruktur.",
    program: "TOEFL Prep",
  },
  {
    name: "Rina Kartika",
    role: "Entrepreneur",
    avatar: "RK",
    rating: 5,
    text: "Metode pembelajaran di English Hive sangat fun dan tidak membosankan. Saya yang sudah lama tidak belajar bahasa Inggris jadi semangat lagi. Highly recommended!",
    program: "General English",
  },
  {
    name: "David Tan",
    role: "High School Student",
    avatar: "DT",
    rating: 5,
    text: "Sebagai siswa SMA, jadwal di English Hive sangat fleksibel. Kelasnya interaktif dan saya jadi lebih percaya diri saat ujian sekolah. Thanks English Hive!",
    program: "Kids & Teens",
  },
];
const cardVariant: Variants = {
  hidden: { opacity: 0, x: 50 },
  visible: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 60 } },
};

export default function Testimonials() {
  const [current, setCurrent] = useState(0);

  const next = () => setCurrent((current + 1) % testimonials.length);
  const prev = () =>
    setCurrent((current - 1 + testimonials.length) % testimonials.length);

  return (
    <section className="bg-muted/30 px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      <div className="mx-auto max-w-7xl">
        {/* <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold text-balance sm:text-4xl lg:text-5xl">
            Apa Kata Mereka?
          </h2>
          <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
            Cerita sukses dari siswa-siswa kami
          </p>
        </div> */}
        <ScrollAnimation variant="fadeUp" className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
            Apa Kata Mereka?
          </h2>
          <p className="text-muted-foreground text-lg">
            Cerita sukses dari siswa-siswa kami
          </p>
        </ScrollAnimation>

        <div className="relative">
          {/* <div className="grid grid-cols-1 gap-6 md:grid-cols-3"> */}
          <ScrollAnimation
            variant="stagger"
            className="grid grid-cols-1 gap-8 md:grid-cols-3"
          >
            {[0, 1, 2].map((offset) => {
              const index = (current + offset) % testimonials.length;
              const testimonial = testimonials[index];
              return (
                <motion.div key={index} variants={cardVariant}>
                  <Card
                    key={index}
                    className={`transition-all duration-300 ${offset === 1 ? "border-primary border-2 md:scale-105" : "opacity-60 md:opacity-100"}`}
                  >
                    <CardContent className="space-y-4 pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback className="bg-primary text-primary-foreground">
                              {testimonial?.avatar}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold">{testimonial?.name}</p>
                            <p className="text-muted-foreground text-sm">
                              {testimonial?.role}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-1">
                        {Array.from({ length: testimonial?.rating ?? 0 }).map(
                          (_, i) => (
                            <Star
                              key={i}
                              className="fill-primary text-primary h-4 w-4"
                            />
                          ),
                        )}
                      </div>

                      <p className="text-muted-foreground italic">
                        &quot;{testimonial?.text}&quot;
                      </p>

                      <div className="pt-2">
                        <span className="bg-secondary text-secondary-foreground rounded-full px-3 py-1 text-xs">
                          {testimonial?.program}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </ScrollAnimation>

          {/* </div> */}

          {/* Navigation Buttons */}
          <div className="mt-8 flex justify-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={prev}
              aria-label="Previous testimonial"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={next}
              aria-label="Next testimonial"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
