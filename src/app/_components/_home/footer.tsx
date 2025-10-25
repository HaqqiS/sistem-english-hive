import Link from "next/link";
import {
  Beef as Bee,
  Instagram,
  Facebook,
  Youtube,
  Linkedin,
  MapPin,
  Phone,
  Mail,
  Clock,
} from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-card text-card-foreground border-border border-t">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="mb-8 grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* About */}
          <div className="space-y-4">
            <div className="text-primary flex items-center gap-2 text-lg font-bold">
              <Bee className="h-5 w-5" />
              <span>English Hive</span>
            </div>
            <p className="text-muted-foreground text-sm">
              Lembaga kursus bahasa Inggris terpercaya dengan metode
              pembelajaran interaktif dan tutor berpengalaman.
            </p>
            <div className="flex gap-4">
              <Link
                href="#"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Instagram className="h-5 w-5" />
              </Link>
              <Link
                href="#"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Facebook className="h-5 w-5" />
              </Link>
              <Link
                href="#"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Youtube className="h-5 w-5" />
              </Link>
              <Link
                href="#"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Linkedin className="h-5 w-5" />
              </Link>
            </div>
          </div>

          {/* Programs */}
          <div className="space-y-4">
            <h3 className="font-semibold">Program</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="#programs"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  General English
                </Link>
              </li>
              <li>
                <Link
                  href="#programs"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Business English
                </Link>
              </li>
              <li>
                <Link
                  href="#programs"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  TOEFL/IELTS Prep
                </Link>
              </li>
              <li>
                <Link
                  href="#programs"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Kids & Teens
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Conversation Club
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div className="space-y-4">
            <h3 className="font-semibold">Perusahaan</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="#about"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Tentang Kami
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Tutor Kami
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Testimoni
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Blog
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Karir
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="font-semibold">Kontak</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <MapPin className="text-primary mt-0.5 h-4 w-4 flex-shrink-0" />
                <span className="text-muted-foreground">
                  Jl. Pendidikan No. 123, Jakarta Selatan
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="text-primary h-4 w-4 flex-shrink-0" />
                <span className="text-muted-foreground">+62 812-3456-7890</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="text-primary h-4 w-4 flex-shrink-0" />
                <span className="text-muted-foreground">
                  info@englishhive.com
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Clock className="text-primary mt-0.5 h-4 w-4 flex-shrink-0" />
                <div className="text-muted-foreground">
                  <div>Senin - Jumat: 08:00 - 21:00</div>
                  <div>Sabtu - Minggu: 08:00 - 17:00</div>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-border border-t pt-8">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-muted-foreground text-sm">
              © 2025 English Hive. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm">
              <Link
                href="#"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                href="#"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                Terms of Service
              </Link>
              <Link
                href="#"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
