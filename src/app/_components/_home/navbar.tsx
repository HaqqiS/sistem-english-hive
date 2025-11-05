"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, Beef as Bee } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signIn } from "next-auth/react";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { label: "Daftar", href: "#registration" },
    { label: "Harga", href: "#pricing" },
    { label: "Jadwal", href: "#schedule" },
    { label: "Tentang", href: "#about" },
  ];

  return (
    <nav className="bg-background/80 border-border sticky top-0 z-50 w-full border-b backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="text-primary flex items-center gap-2 text-xl font-bold"
          >
            <Bee className="h-6 w-6" />
            <span>English Hive</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden items-center gap-4 md:flex">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-foreground hover:text-primary transition-colors"
              >
                <Button variant="ghost" className="text-base">
                  {link.label}
                </Button>
              </a>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden items-center gap-4 md:flex">
            <Button variant="outline" size="sm" onClick={() => signIn()}>
              Log In
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="space-y-2 pb-4 md:hidden">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-foreground hover:text-primary hover:bg-muted block rounded-md px-4 py-2 text-sm font-medium transition-colors"
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Button className="mt-4 w-full" size="sm">
              Log In
            </Button>
          </div>
        )}
      </div>
    </nav>
  );
}
