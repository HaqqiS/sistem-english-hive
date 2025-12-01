"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Home, ArrowLeft, SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <div className="bg-background relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden px-4 text-center">
      {/* --- Background Decoration (Sama seperti Hero) --- */}
      <div className="bg-primary/10 absolute -top-[10%] -right-[5%] -z-10 h-[500px] w-[500px] animate-pulse rounded-full blur-3xl" />
      <div className="bg-secondary/20 absolute -bottom-[10%] -left-[10%] -z-10 h-[400px] w-[400px] rounded-full blur-3xl" />

      {/* --- Main Content --- */}
      <div className="z-10 max-w-2xl space-y-8">
        {/* Icon Animasi Floating */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="flex justify-center"
        >
          <motion.div
            animate={{ y: [0, -15, 0] }}
            transition={{
              repeat: Infinity,
              duration: 4,
              ease: "easeInOut",
            }}
            className="bg-muted/50 relative flex h-40 w-40 items-center justify-center rounded-full shadow-lg backdrop-blur-sm"
          >
            <SearchX className="text-primary h-20 w-20" />
            {/* Dekorasi kecil */}
            <div className="bg-accent absolute -top-2 -right-2 h-6 w-6 rounded-full" />
            <div className="bg-secondary absolute -bottom-1 -left-1 h-4 w-4 rounded-full" />
          </motion.div>
        </motion.div>

        {/* Teks 404 */}
        <div className="space-y-4">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-foreground text-8xl font-extrabold tracking-tighter sm:text-9xl"
          >
            4<span className="text-primary">0</span>4
          </motion.h1>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-2xl font-bold tracking-tight sm:text-3xl"
          >
            Halaman Tidak Ditemukan
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="text-muted-foreground mx-auto max-w-md"
          >
            Maaf, halaman yang Anda cari mungkin telah dihapus, namanya diganti,
            atau sedang tidak tersedia sementara waktu.
          </motion.p>
        </div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <Button size="lg" className="w-full gap-2 sm:w-auto" asChild>
            <Link href="/">
              <Home className="h-4 w-4" />
              Kembali ke Beranda
            </Link>
          </Button>

          <Button
            variant="outline"
            size="lg"
            className="w-full gap-2 sm:w-auto"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali Sebelumnya
          </Button>
        </motion.div>
      </div>

      {/* Footer Kecil (Opsional) */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="text-muted-foreground absolute bottom-8 text-sm"
      >
        &copy; 2025 English Hive System
      </motion.div>
    </div>
  );
}
