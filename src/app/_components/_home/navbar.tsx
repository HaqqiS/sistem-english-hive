"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signIn, useSession } from "next-auth/react";
import { UserRole } from "@/server/auth/type";
import Image from "next/image";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { data: session } = useSession();

  const navLinks = [
    { label: "Daftar", href: "#registration" },
    { label: "Harga", href: "#pricing" },
    { label: "Jadwal", href: "#schedule" },
    { label: "Tentang", href: "#about" },
  ];

  return (
    <nav className="bg-accent/70 border-border sticky top-0 z-50 w-full border-b backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}

          <Link
            href="/"
            className="text-accent-foreground dark:text-secondary-foreground flex items-center gap-2 text-xl font-bold"
          >
            <Image
              src="/logo_putih.webp"
              alt="English Hive Logo"
              width={40}
              height={40}
            />

            <span>English Hive</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden items-center gap-4 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-accent-foreground dark:text-secondary-foreground hover:text-primary transition-colors"
              >
                <Button variant="ghost" className="text-base font-medium">
                  {link.label}
                </Button>
              </Link>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden items-center gap-4 md:flex">
            {!session?.user && (
              <Button
                variant="outline"
                className="text-accent"
                size="sm"
                onClick={() => signIn()}
              >
                Log In
              </Button>
            )}
            {session?.user.role === UserRole.ADMIN ? (
              <Button
                variant="outline"
                className="text-accent"
                size="sm"
                asChild
              >
                <Link href="/admin">Dashboard</Link>
              </Button>
            ) : session?.user.role === UserRole.GURU ? (
              <Button
                variant="outline"
                className="text-accent"
                size="sm"
                asChild
              >
                <Link href="/guru">Dashboard</Link>
              </Button>
            ) : null}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? (
              <X className="text-accent-foreground dark:text-secondary-foreground h-6 w-6" />
            ) : (
              <Menu className="text-accent-foreground dark:text-secondary-foreground h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="space-y-2 pb-4 md:hidden">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-accent-foreground dark:text-secondary-foreground hover:text-secondary-foreground block rounded-md px-4 py-2 text-sm font-medium transition-colors"
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </Link>
            ))}

            {!session?.user && (
              <Button
                variant="outline"
                className="text-accent mt-4 w-full"
                size="sm"
                onClick={() => signIn()}
              >
                Log In
              </Button>
            )}
            {session?.user.role === UserRole.ADMIN ? (
              <Button
                variant="outline"
                className="text-accent mt-4 w-full"
                size="sm"
                asChild
              >
                <Link href="/admin">Dashboard</Link>
              </Button>
            ) : session?.user.role === UserRole.GURU ? (
              <Button
                variant="outline"
                className="text-accent mt-4 w-full"
                size="sm"
                asChild
              >
                <Link href="/guru">Dashboard</Link>
              </Button>
            ) : null}
          </div>
        )}
      </div>
    </nav>
  );
}
