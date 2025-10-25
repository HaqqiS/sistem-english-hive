import { ArrowRight, MessageCircle } from "lucide-react";
import { Button } from "@/app/_components/ui/button";

export default function CTA() {
  return (
    <section className="from-primary to-secondary bg-gradient-to-r px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
      <div className="mx-auto max-w-4xl space-y-8 text-center">
        <h2 className="text-primary-foreground text-3xl font-bold text-balance sm:text-4xl lg:text-5xl">
          Siap Meningkatkan Kemampuan Bahasa Inggris Anda?
        </h2>

        <p className="text-primary-foreground/90 mx-auto max-w-2xl text-lg">
          Bergabunglah dengan ratusan siswa yang telah merasakan transformasi
          belajar di English Hive
        </p>

        <div className="flex flex-col justify-center gap-4 pt-4 sm:flex-row">
          <Button
            size="lg"
            className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 group gap-2"
          >
            Daftar Sekarang
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10 gap-2 bg-transparent"
          >
            <MessageCircle className="h-4 w-4" />
            Hubungi Kami
          </Button>
        </div>
      </div>
    </section>
  );
}
