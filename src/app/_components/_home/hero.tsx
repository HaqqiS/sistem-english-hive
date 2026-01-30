"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import { ScrollAnimation } from "@/app/_components/shared/scroll-animation";
import { Button } from "@/components/ui/button";
import MarqueeBanner from "./marquee_banner";

export default function Hero() {
	return (
		<section className="bg-background relative flex min-h-[calc(100vh)] flex-col overflow-hidden pt-20">
			{/* Background Decoration (Optional - Pastel Blob) */}
			<div className="bg-primary/10 absolute top-[-10%] right-[-5%] -z-10 h-[500px] w-[500px] animate-pulse rounded-full blur-3xl" />
			<div className="bg-secondary/20 absolute bottom-[10%] left-[-10%] -z-10 h-[400px] w-[400px] rounded-full blur-3xl" />

			{/* Main Content Container: Flex Grow agar Marquee terdorong ke bawah */}
			<div className="flex grow items-center justify-center px-4 py-8 sm:px-6 lg:px-8 lg:py-0">
				<div className="mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-8">
					{/* LEFT: Text Content */}
					<div className="z-10 order-1 space-y-6 text-center lg:text-left">
						<ScrollAnimation>
							<div className="border-primary/30 bg-primary/5 text-primary mb-4 inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium">
								<span className="bg-primary mr-2 flex h-2 w-2 animate-ping rounded-full"></span>
								Pendaftaran Kelas Baru Dibuka
							</div>
						</ScrollAnimation>

						<ScrollAnimation delay={0.1}>
							<h1 className="text-foreground text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:leading-tight">
								Belajar Bahasa Inggris <br className="hidden lg:block" />
								<span className="from-primary to-secondary bg-linear-to-tl bg-clip-text text-transparent">
									Jadi Lebih Percaya Diri!
								</span>
							</h1>
						</ScrollAnimation>

						<ScrollAnimation delay={0.2}>
							<p className="text-muted-foreground mx-auto max-w-2xl text-lg leading-relaxed lg:mx-0">
								Metode belajar interaktif yang dirancang khusus untuk membantu
								Anda fasih berbicara dan sukses dalam akademik maupun karir.
								Gabung bersama English Hive sekarang.
							</p>
						</ScrollAnimation>

						<ScrollAnimation delay={0.3}>
							<div className="flex flex-col items-center justify-center gap-4 pt-2 sm:flex-row lg:justify-start">
								<Button
									size="lg"
									className="shadow-primary/20 w-full gap-2 shadow-lg sm:w-auto"
									asChild
								>
									<a href="#registration">
										Daftar Sekarang
										<ArrowRight className="h-4 w-4" />
									</a>
								</Button>
								<Button
									size="lg"
									variant="outline"
									className="bg-background/50 w-full backdrop-blur-sm sm:w-auto"
									asChild
								>
									<a href="#programs">Lihat Program</a>
								</Button>
							</div>
						</ScrollAnimation>

						<ScrollAnimation delay={0.4}>
							<div className="text-muted-foreground flex items-center justify-center gap-4 pt-4 text-sm lg:justify-start">
								<div className="flex -space-x-2">
									{[1, 2, 3].map((i) => (
										<div
											key={i}
											className="border-background h-8 w-8 rounded-full border-2 bg-gray-200"
										/>
									))}
								</div>
								<p>Bergabung dengan 500+ siswa lainnya</p>
							</div>
						</ScrollAnimation>
					</div>

					{/* RIGHT: Image Illustration */}
					{/* Mobile: Order 2 (di bawah teks), Desktop: Order 2 (di kanan) */}
					<div className="relative order-2 flex items-center justify-center">
						<ScrollAnimation delay={0.3} className="relative w-fit">
							{/* Abstract Shape behind image */}
							<div className="from-accent/30 to-secondary/30 absolute inset-0 scale-95 rotate-6 rounded-4xl bg-linear-to-tr" />

							<div className="relative h-fit w-fit overflow-hidden rounded-2xl border-4 border-white/50 shadow-2xl">
								<Image
									src="/hero_image.webp"
									// src="/miss_desak.webp"
									alt="English Learning Activity"
									height={400}
									width={300}
									className="object-contain object-top transition-transform duration-700 hover:scale-105"
									priority
								/>

								{/* Floating Card Decoration */}
								<motion.div
									animate={{ y: [0, -10, 0] }}
									transition={{
										repeat: Infinity,
										duration: 3,
										ease: "easeInOut",
									}}
									className="absolute bottom-6 left-6 hidden max-w-[150px] rounded-xl bg-white/90 p-3 shadow-lg backdrop-blur sm:block"
								>
									<p className="text-primary text-xs font-bold">Fun Learning</p>
									<p className="text-muted-foreground text-[10px]">
										Interactive & Engaging classes
									</p>
								</motion.div>
							</div>
						</ScrollAnimation>
					</div>
				</div>
			</div>

			{/* Footer Hero: Marquee */}
			{/* "mt-auto" memastikan dia kedorong ke paling bawah container flex */}
			<div className="border-border/50 bg-background/50 z-10 mt-auto w-full border-t backdrop-blur-sm">
				<MarqueeBanner />
			</div>
		</section>
	);
}
