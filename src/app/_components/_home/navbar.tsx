"use client";

import { AnimatePresence, motion } from "framer-motion";
import { LogIn, Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { signIn, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { UserRole } from "@/server/auth/type";

export default function Navbar() {
	const [isOpen, setIsOpen] = useState(false);
	const [isScrolled, setIsScrolled] = useState(false);
	const { data: session } = useSession();

	// Deteksi scroll
	useEffect(() => {
		const handleScroll = () => setIsScrolled(window.scrollY > 20);
		window.addEventListener("scroll", handleScroll);
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	// Kunci scroll body saat menu mobile terbuka
	useEffect(() => {
		if (isOpen) {
			document.body.style.overflow = "hidden";
		} else {
			document.body.style.overflow = "unset";
		}
	}, [isOpen]);

	const navLinks = [
		{ label: "Program", href: "#programs" },
		{ label: "Biaya", href: "#pricing" },
		{ label: "Jadwal", href: "#schedule" },
		{ label: "Tentang", href: "#about" },
	];

	// Helper untuk menentukan style background navbar
	// Jika Menu Terbuka (isOpen) -> Paksa background solid agar menyatu dengan menu
	// Jika Scrolled -> Glassmorphism
	// Jika Top -> Transparan
	const navBackgroundClass = isOpen
		? "bg-background border-b border-border"
		: isScrolled
			? "bg-background/80 border-border/50 border-b shadow-sm backdrop-blur-md"
			: "border-transparent bg-transparent";

	return (
		<motion.nav
			initial={{ y: -100 }}
			animate={{ y: 0 }}
			transition={{ duration: 0.5 }}
			className={cn(
				"fixed top-0 right-0 left-0 z-50 transition-all duration-300 ease-in-out",
				navBackgroundClass,
				isOpen ? "py-2" : isScrolled ? "py-2" : "py-4", // Samakan padding saat open/scrolled
			)}
		>
			<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				<div className="flex h-16 items-center justify-between">
					{/* Logo */}
					<Link
						href="/"
						className="z-50 flex items-center gap-2"
						onClick={() => setIsOpen(false)}
					>
						<div className="relative h-10 w-10">
							<Image
								src="/logo_hijau2.webp"
								alt="English Hive Logo"
								fill
								className="object-contain"
							/>
						</div>
						<span className="text-primary text-xl font-bold tracking-tight">
							English Hive
						</span>
					</Link>

					{/* Desktop Navigation */}
					<div className="hidden items-center gap-4 md:flex">
						{navLinks.map((link) => (
							<Link key={link.href} href={link.href}>
								<Button
									variant="ghost"
									className={cn(
										"hover:bg-primary/10 text-base font-medium",
										"text-foreground/80 hover:text-primary", // Gunakan foreground agar adaptif Dark/Light mode
									)}
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
								variant="ghost"
								size="sm"
								onClick={() => signIn()}
								className={cn(
									"gap-2 text-base",
									// Perbaikan Warna: Gunakan text-foreground agar terlihat jelas di Light/Dark mode
									// Hover state menggunakan warna primary agar konsisten
									"text-foreground/70 hover:bg-primary/10 hover:text-primary",
								)}
							>
								<LogIn className="h-4 w-4" />
								<span className="hidden lg:inline">Masuk</span>
							</Button>
						) : (
							<Button variant="ghost" size="sm" asChild className="text-base">
								<Link
									href={
										session?.user.role === UserRole.ADMIN ||
										session?.user.role === UserRole.MANAGER
											? "/admin"
											: "/guru"
									}
								>
									Dashboard
								</Link>
							</Button>
						)}

						{/* Tombol Daftar (Primary) */}
						{!session?.user && (
							<Button
								variant="default"
								size="sm"
								asChild
								className="text-base font-semibold shadow-sm transition-all hover:scale-105 dark:text-white"
							>
								<a href="#registration">Daftar Sekarang</a>
							</Button>
						)}
					</div>

					{/* Mobile Menu Button */}
					<Button
						className="text-foreground z-50 rounded-md p-2 transition-colors hover:bg-black/5 md:hidden"
						onClick={() => setIsOpen(!isOpen)}
						aria-label="Toggle menu"
					>
						{isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
					</Button>
				</div>
			</div>

			{/* Mobile Navigation Menu */}
			<AnimatePresence>
				{isOpen && (
					<motion.div
						initial={{ opacity: 0, x: "100%" }}
						animate={{ opacity: 1, x: 0 }}
						exit={{ opacity: 0, x: "100%" }}
						transition={{ type: "tween", duration: 0.3 }}
						// PERBAIKAN: top-16 agar mulai DI BAWAH header, tidak tertutup
						// h-[calc(100vh-4rem)] agar tinggi pas sisa layar
						className="bg-background fixed inset-x-0 top-16 z-40 flex h-[calc(100vh-4rem)] flex-col items-center justify-center gap-8 md:hidden"
					>
						<div className="flex flex-col items-center gap-6">
							{navLinks.map((link, i) => (
								<motion.div
									key={link.href}
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: 0.1 + i * 0.1 }}
								>
									<Link
										href={link.href}
										className="text-foreground hover:text-primary text-2xl font-bold transition-colors"
										onClick={() => setIsOpen(false)}
									>
										{link.label}
									</Link>
								</motion.div>
							))}
						</div>

						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.5 }}
							className="mt-8 flex w-64 flex-col gap-4"
						>
							<Button
								size="lg"
								className="w-full text-lg dark:text-white"
								asChild
								onClick={() => setIsOpen(false)}
							>
								<a href="#registration">Daftar Sekarang</a>
							</Button>

							{!session?.user ? (
								<Button
									variant="outline"
									size="lg"
									className="w-full gap-2"
									onClick={async () => {
										await signIn();
										setIsOpen(false);
									}}
								>
									<LogIn className="h-4 w-4" /> Masuk (Guru)
								</Button>
							) : (
								<Button
									variant="outline"
									size="lg"
									className="w-full"
									asChild
									onClick={() => setIsOpen(false)}
								>
									<Link
										href={
											session?.user.role === UserRole.ADMIN ||
											session?.user.role === UserRole.MANAGER
												? "/admin"
												: "/guru"
										}
									>
										Ke Dashboard
									</Link>
								</Button>
							)}
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>
		</motion.nav>
	);
}
