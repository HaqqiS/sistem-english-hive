"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollAnimation } from "@/app/_components/shared/scroll-animation";
import { motion, useScroll, useVelocity, type Variants } from "framer-motion";

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

export default function Testimonials() {
  const [current, setCurrent] = useState(0);
  // Ref to track if navigation was just clicked to disable scroll animation logic temporarily
  const isNavigating = useRef(false);

  const next = () => {
    isNavigating.current = true;
    setCurrent((current + 1) % testimonials.length);
    // Reset navigation flag after a short delay to re-enable scroll logic if needed later
    setTimeout(() => {
      isNavigating.current = false;
    }, 500);
  };

  const prev = () => {
    isNavigating.current = true;
    setCurrent((current - 1 + testimonials.length) % testimonials.length);
    setTimeout(() => {
      isNavigating.current = false;
    }, 500);
  };

  // --- Logic Animasi Scroll Direction ---
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const [scrollDirection, setScrollDirection] = useState(1); // 1: Down, -1: Up

  useEffect(() => {
    const unsubscribe = scrollVelocity.on("change", (latest) => {
      // Only update scroll direction if NOT navigating via buttons
      if (!isNavigating.current) {
        if (latest > 0) {
          setScrollDirection(1);
        } else if (latest < 0) {
          setScrollDirection(-1);
        }
      }
    });
    return () => unsubscribe();
  }, [scrollVelocity]);

  // Variants untuk Container Grid (Scroll Entrance)
  const containerVariants: Variants = {
    hidden: (direction: number) => ({
      opacity: 0,
      transition: {
        when: "afterChildren",
        staggerChildren: 0.1,
        staggerDirection: direction,
      },
    }),
    visible: (direction: number) => ({
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.15,
        staggerDirection: direction,
      },
    }),
  };

  // Variants untuk Item Wrapper (Scroll Entrance)
  const itemVariants: Variants = {
    hidden: {
      opacity: 0,
      y: 30,
      scale: 0.9,
      transition: { duration: 0.3, ease: "easeInOut" },
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 50,
        damping: 15,
      },
    },
  };

  return (
    <section className="bg-muted/30 px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      <div className="mx-auto max-w-7xl">
        {/* Header tetap menggunakan ScrollAnimation standar */}
        <ScrollAnimation variant="fadeUp" className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
            Apa Kata Mereka?
          </h2>
          <p className="text-muted-foreground text-lg">
            Cerita sukses dari siswa-siswa kami
          </p>
        </ScrollAnimation>

        <div className="relative">
          {/* Container Grid yang meng-handle Scroll Animation */}
          <motion.div
            className="grid grid-cols-1 gap-8 md:grid-cols-3"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, amount: 0.2, margin: "-50px" }}
            custom={scrollDirection}
            variants={containerVariants}
          >
            {[0, 1, 2].map((offset) => {
              const index = (current + offset) % testimonials.length;
              const testimonial = testimonials[index];

              return (
                // Item wrapper untuk Scroll Animation (stagger effect)
                // Key ini HARUS statis (0, 1, 2) agar grid tidak re-mount saat navigasi
                <motion.div
                  key={offset}
                  variants={itemVariants}
                  className="h-full"
                >
                  {/* Card Content - No animation on navigation change */}
                  <div className="h-full">
                    <Card
                      className={`h-full transition-all duration-300 ${
                        offset === 1
                          ? "border-primary relative z-10 border-2 shadow-xl md:scale-105"
                          : "opacity-60 md:opacity-100"
                      }`}
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
                              <p className="font-semibold">
                                {testimonial?.name}
                              </p>
                              <p className="text-muted-foreground text-sm">
                                {testimonial?.role}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-1">
                          {Array.from({
                            length: testimonial?.rating ?? 0,
                          }).map((_, i) => (
                            <Star
                              key={i}
                              className="fill-primary text-primary h-4 w-4"
                            />
                          ))}
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
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

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
