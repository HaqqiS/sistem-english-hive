"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signIn, useSession } from "next-auth/react";
import { UserRole } from "@/server/auth/type";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { data: session } = useSession();

  // Deteksi scroll untuk efek tambahan (opsional, misal nambah shadow)
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { label: "Program", href: "#programs" },
    { label: "Biaya", href: "#pricing" },
    { label: "Jadwal", href: "#schedule" },
    { label: "Tentang", href: "#about" },
  ];

  return (
    // PENGATURAN WARNA NAVBAR:
    // bg-accent/85: Menggunakan warna accent (teal/pastel) dengan transparansi 85%
    // backdrop-blur-md: Efek kaca buram
    // text-accent-foreground: Teks putih (sesuai definisi global css)
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      className={`bg-accent/85 text-accent-foreground fixed top-0 right-0 left-0 z-50 border-b border-white/10 shadow-sm backdrop-blur-md transition-all duration-300`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="z-50 flex items-center gap-2">
            <div className="relative h-10 w-10">
              {/* Pastikan logo putih */}
              <Image
                src="/logo_putih.webp"
                alt="English Hive Logo"
                fill
                className="object-contain"
              />
            </div>
            <span className="text-xl font-bold tracking-tight">
              English Hive
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <Button
                  variant="ghost"
                  className="text-accent-foreground/90 font-medium hover:bg-white/20 hover:text-white"
                >
                  {link.label}
                </Button>
              </Link>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden items-center gap-3 md:flex">
            {!session?.user ? (
              <Button
                variant="secondary" // Putih/Terang agar kontras dengan accent
                size="sm"
                onClick={() => signIn()}
                className="font-semibold shadow-md transition-all hover:shadow-lg"
              >
                Masuk
              </Button>
            ) : (
              <Button variant="secondary" size="sm" asChild>
                <Link
                  href={
                    session?.user.role === UserRole.ADMIN ? "/admin" : "/guru"
                  }
                >
                  Dashboard
                </Link>
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="z-50 rounded-md p-2 transition-colors hover:bg-white/20 md:hidden"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Menu (Full Screen Overlay) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "100vh" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-accent fixed inset-0 top-0 z-40 flex flex-col items-center justify-center gap-6 overflow-hidden md:hidden"
          >
            {navLinks.map((link, i) => (
              <motion.div
                key={link.href}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.1 }}
              >
                <Link
                  href={link.href}
                  className="text-accent-foreground text-2xl font-bold hover:opacity-80"
                  onClick={() => setIsOpen(false)}
                >
                  {link.label}
                </Link>
              </motion.div>
            ))}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-4"
            >
              {!session?.user ? (
                <Button
                  variant="secondary"
                  size="lg"
                  className="w-40"
                  onClick={async () => {
                    await signIn();
                    setIsOpen(false);
                  }}
                >
                  Masuk / Daftar
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  size="lg"
                  asChild
                  onClick={() => setIsOpen(false)}
                >
                  <Link href="/guru">Dashboard</Link>
                </Button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
