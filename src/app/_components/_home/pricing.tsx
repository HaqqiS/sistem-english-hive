"use client";

import { motion, type Variants } from "framer-motion";
import { Check, User, Users } from "lucide-react";
import { ScrollAnimation } from "@/app/_components/shared/scroll-animation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { useScrollDirection } from "@/hooks/use-scroll-direction";

const pricingOptions = [
	{
		title: "Kelas Regular",
		description: "Belajar seru dan interaktif bersama teman-teman sebaya.",
		icon: Users,
		features: [
			"Maksimal 10 Siswa per kelas",
			"Interaksi sosial yang aktif",
			"Jadwal tetap & terstruktur",
			"Biaya lebih terjangkau",
			"Kurikulum standar English Hive",
			"Sertifikat penyelesaian",
		],
		highlight: false,
		buttonText: "Daftar Regular",
	},
	{
		title: "Kelas Private",
		description:
			"Fokus intensif dengan materi yang disesuaikan kebutuhan Anda.",
		icon: User,
		features: [
			"1-on-1 dengan Tutor (Eksklusif)",
			"Materi Customized (Sesuai target)",
			"Jadwal Fleksibel (Sesuai kesepakatan)",
			"Progress monitoring intensif",
			"Bisa request fokus materi (Cth: Speaking)",
			"Sertifikat & Laporan personal",
		],
		highlight: true,
		buttonText: "Daftar Private",
	},
];

export default function Pricing() {
	const scrollDirection = useScrollDirection();

	// Variants untuk Container Grid
	const containerVariants: Variants = {
		hidden: { opacity: 0 },
		visible: (direction: number) => ({
			opacity: 1,
			transition: {
				staggerChildren: 0.2,
				staggerDirection: direction,
			},
		}),
	};

	// Variants untuk Item Card
	const itemVariants: Variants = {
		hidden: {
			opacity: 0,
			y: 50,
			scale: 0.9,
		},
		visible: {
			opacity: 1,
			y: 0,
			scale: 1,
			transition: {
				type: "spring",
				stiffness: 60,
				damping: 15,
				mass: 1,
			},
		},
	};

	return (
		<section className="bg-muted/30 py-20" id="pricing">
			<div className="mx-auto max-w-7xl px-6 lg:px-8">
				<ScrollAnimation
					variant="fadeUp"
					className="mx-auto mb-16 max-w-2xl text-center"
					once={true}
				>
					<h2 className="text-foreground text-3xl font-bold tracking-tight sm:text-4xl">
						Pilih Tipe Kelas Anda
					</h2>
					<p className="text-muted-foreground mt-4 text-lg">
						Sesuaikan metode belajar dengan kebutuhan dan preferensi putra-putri
						Anda.
					</p>
				</ScrollAnimation>

				<motion.div
					className="mx-auto grid max-w-4xl grid-cols-1 gap-8 md:grid-cols-2"
					initial="hidden"
					whileInView="visible"
					viewport={{ once: true, amount: 0.3, margin: "-100px" }}
					custom={scrollDirection}
					variants={containerVariants}
				>
					{pricingOptions.map((option) => {
						const Icon = option.icon;
						return (
							<motion.div
								key={option.title}
								variants={itemVariants}
								className="h-full"
							>
								<Card
									className={`relative flex h-full flex-col transition-all duration-300 ${
										option.highlight
											? "border-primary z-10 scale-105 shadow-xl"
											: "border-border hover:border-primary/50"
									}`}
								>
									{option.highlight && (
										<div className="absolute -top-4 right-0 left-0 flex justify-center">
											<Badge className="bg-primary text-primary-foreground px-4 py-1">
												Paling Fleksibel
											</Badge>
										</div>
									)}
									<CardHeader>
										<div className="mb-2 flex items-center gap-3">
											<div
												className={`rounded-full p-2 ${
													option.highlight
														? "bg-primary/10 text-primary"
														: "bg-muted text-muted-foreground"
												}`}
											>
												<Icon className="h-6 w-6" />
											</div>
											<CardTitle className="text-2xl">{option.title}</CardTitle>
										</div>
										<CardDescription className="text-base">
											{option.description}
										</CardDescription>
									</CardHeader>
									<CardContent className="flex-1">
										<ul className="space-y-3">
											{option.features.map((feature) => (
												<li
													key={feature}
													className="flex items-start gap-3 text-sm"
												>
													<Check className="h-5 w-5 shrink-0 text-green-500" />
													<span className="text-muted-foreground">
														{feature}
													</span>
												</li>
											))}
										</ul>
									</CardContent>
									<CardFooter>
										<Button
											className="w-full"
											variant={option.highlight ? "default" : "outline"}
											size="lg"
											asChild
										>
											<a href="#registration">{option.buttonText}</a>
										</Button>
									</CardFooter>
								</Card>
							</motion.div>
						);
					})}
				</motion.div>
			</div>
		</section>
	);
}
