"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollAnimation } from "@/app/_components/shared/scroll-animation";
import {
	motion,
	useScroll,
	useVelocity,
	type Variants,
	AnimatePresence,
	LayoutGroup,
} from "framer-motion";

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
	{
		name: "Galih Ramadhan",
		role: "High School Student",
		avatar: "GR",
		rating: 5,
		text: "Kelas di English Hive seru banget! Gurunya asik dan cara mengajarnya gampang dimengerti. Nilai bahasa Inggris saya di sekolah jadi naik terus.",
		program: "Kids & Teens",
	},
];

export default function Testimonials() {
	const [current, setCurrent] = useState(0);
	// Kita simpan arah navigasi untuk mengatur arah animasi masuk/keluar item baru
	const [direction, setDirection] = useState(0);
	const isNavigating = useRef(false);

	const next = () => {
		isNavigating.current = true;
		setDirection(1);
		setCurrent((prev) => (prev + 1) % testimonials.length);
		setTimeout(() => {
			isNavigating.current = false;
		}, 600);
	};

	const prev = () => {
		isNavigating.current = true;
		setDirection(-1);
		setCurrent(
			(prev) => (prev - 1 + testimonials.length) % testimonials.length,
		);
		setTimeout(() => {
			isNavigating.current = false;
		}, 600);
	};

	const { scrollY } = useScroll();
	const scrollVelocity = useVelocity(scrollY);
	const [scrollDirection, setScrollDirection] = useState(1);

	useEffect(() => {
		const unsubscribe = scrollVelocity.on("change", (latest) => {
			if (!isNavigating.current) {
				if (latest > 0) setScrollDirection(1);
				else if (latest < 0) setScrollDirection(-1);
			}
		});
		return () => unsubscribe();
	}, [scrollVelocity]);

	// Variants untuk Container Grid (Hanya untuk entrance awal scroll)
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

	// --- CALCULATE VISIBLE ITEMS ---
	// Kita harus merender 3 item aktual (Bukan index 0,1,2 statis)
	// Urutan: [Prev, Current, Next]
	const count = testimonials.length;
	const prevIndex = (current - 1 + count) % count;
	const nextIndex = (current + 1) % count;

	// Data yang akan dirender
	const visibleItems = [
		{ ...testimonials[prevIndex], id: prevIndex, position: "left" },
		{ ...testimonials[current], id: current, position: "center" },
		{ ...testimonials[nextIndex], id: nextIndex, position: "right" },
	];

	return (
		<section className="bg-muted/30 px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
			<div className="mx-auto max-w-7xl">
				<ScrollAnimation
					variant="fadeUp"
					className="mb-16 text-center"
					once={true}
				>
					<h2 className="text-foreground mb-4 text-3xl font-bold sm:text-4xl">
						Apa Kata Mereka?
					</h2>
					<p className="text-muted-foreground text-lg">
						Cerita sukses dari siswa-siswa kami
					</p>
				</ScrollAnimation>

				<div className="relative">
					{/* Menggunakan LayoutGroup agar Framer Motion tahu context perpindahan layout.
					 */}
					<LayoutGroup>
						<motion.div
							className="grid grid-cols-1 gap-8 md:grid-cols-3"
							initial="hidden"
							whileInView="visible"
							viewport={{ once: true, amount: 0.2, margin: "-50px" }}
							custom={scrollDirection}
							variants={containerVariants}
						>
							<AnimatePresence mode="popLayout" custom={direction}>
								{visibleItems.map((item) => {
									const isCenter = item.position === "center";

									// Tentukan style aktif/inaktif
									const activeClass =
										"border-primary relative z-10 border-2 shadow-xl md:scale-105 opacity-100";
									const inactiveClass =
										"border-border opacity-60 md:opacity-100 hover:opacity-100 scale-100";

									return (
										<motion.div
											layout // <--- KUNCI ANIMASI SLIDE
											key={item.name} // Key harus unik berdasarkan konten (Nama/ID)
											initial={{ opacity: 0, scale: 0.8, x: 20 * direction }}
											animate={{
												opacity: 1,
												scale: 1,
												x: 0,
												zIndex: isCenter ? 10 : 0, // Pastikan yang tengah di atas
											}}
											exit={{ opacity: 0, scale: 0.8, x: -20 * direction }}
											transition={{
												layout: { type: "spring", stiffness: 45, damping: 12 }, // Animasi pergeseran posisi
												opacity: { duration: 0.2 },
											}}
											className="h-full"
										>
											<Card
												className={`h-full transition-all duration-500 ${isCenter ? activeClass : inactiveClass}`}
											>
												<CardContent className="space-y-4 pt-6">
													<div className="flex items-center justify-between">
														<div className="flex items-center gap-3">
															<Avatar>
																<AvatarFallback className="bg-primary text-primary-foreground">
																	{item.avatar}
																</AvatarFallback>
															</Avatar>
															<div>
																<p className="font-semibold">{item.name}</p>
																<p className="text-muted-foreground text-sm">
																	{item.role}
																</p>
															</div>
														</div>
													</div>

													<div className="flex gap-1">
														{Array.from({ length: item.rating ?? 0 }).map(
															(_, i) => (
																<Star
																	key={i}
																	className="fill-primary text-primary h-4 w-4"
																/>
															),
														)}
													</div>

													<p className="text-muted-foreground italic">
														&quot;{item.text}&quot;
													</p>

													<div className="pt-2">
														<span className="bg-secondary text-secondary-foreground rounded-full px-3 py-1 text-xs">
															{item.program}
														</span>
													</div>
												</CardContent>
											</Card>
										</motion.div>
									);
								})}
							</AnimatePresence>
						</motion.div>
					</LayoutGroup>

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
