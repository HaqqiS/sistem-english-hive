"use client";

import { motion, type Variants } from "framer-motion";
import {
	BookOpen,
	GraduationCap,
	Rocket,
	Sparkles,
	Star,
	Sun,
	Trophy,
} from "lucide-react";
import { ScrollAnimation } from "@/app/_components/shared/scroll-animation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useScrollDirection } from "@/hooks/use-scroll-direction";

const programs = [
	{
		title: "TinyTods",
		age: "3-4 Tahun",
		description:
			"Pengenalan Bahasa Inggris melalui lagu, gerak, dan permainan sensorik.",
		icon: Star,
		color: "text-yellow-500",
	},
	{
		title: "PreLittleStar",
		age: "4-5 Tahun",
		description:
			"Membangun kosakata dasar dan kepercayaan diri untuk berbicara.",
		icon: Sun,
		color: "text-orange-500",
	},
	{
		title: "LittleStar",
		age: "5-6 Tahun",
		description: "Fokus pada phonics dasar dan pembentukan kalimat sederhana.",
		icon: Sparkles,
		color: "text-purple-500",
	},
	{
		title: "RisingStar",
		age: "SD Kelas 1-2",
		description: "Penguatan grammar dasar dan reading comprehension awal.",
		icon: Rocket,
		color: "text-blue-500",
	},
	{
		title: "PreShiningStar",
		age: "SD Kelas 3-4",
		description: "Peningkatan kemampuan speaking dan listening interaktif.",
		icon: BookOpen,
		color: "text-green-500",
	},
	{
		title: "ShiningStar",
		age: "SD Kelas 5-6",
		description: "Persiapan menuju tingkat lanjut dengan materi komprehensif.",
		icon: Trophy,
		color: "text-red-500",
	},
	{
		title: "Elementary",
		age: "SMP / Umum",
		description:
			"Program intensif mencakup 4 skill utama: Speaking, Listening, Reading, Writing.",
		icon: GraduationCap,
		color: "text-indigo-500",
	},
];

export default function Programs() {
	const scrollDirection = useScrollDirection();

	// Variants Container
	const containerVariants: Variants = {
		hidden: { opacity: 0 },
		visible: (direction: number) => ({
			opacity: 1,
			transition: {
				staggerChildren: 0.08,
				staggerDirection: direction,
			},
		}),
	};

	// Variants Item
	const itemVariants: Variants = {
		hidden: {
			opacity: 0,
			y: 30,
			scale: 0.8,
		},
		visible: {
			opacity: 1,
			y: 0,
			scale: 1,
			transition: {
				type: "spring",
				stiffness: 70,
				damping: 12,
			},
		},
	};

	return (
		<section
			className="bg-background overflow-hidden py-16 sm:py-24"
			id="programs"
		>
			<div className="mx-auto max-w-7xl px-6 lg:px-8">
				<ScrollAnimation
					variant="fadeUp"
					className="mx-auto mb-12 max-w-2xl text-center"
					once={true}
				>
					<h2 className="text-foreground text-3xl font-bold tracking-tight sm:text-4xl">
						Jenjang Program Kami
					</h2>
					<p className="text-muted-foreground mt-4 text-lg leading-8">
						Kurikulum yang disesuaikan dengan usia dan tahap perkembangan siswa.
					</p>
				</ScrollAnimation>

				<motion.div
					className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
					initial="hidden"
					whileInView="visible"
					viewport={{ once: true, amount: 0.2, margin: "-50px" }}
					custom={scrollDirection}
					variants={containerVariants}
				>
					{programs.map((program) => {
						const Icon = program.icon;
						return (
							<motion.div key={program.title} variants={itemVariants}>
								<Card className="hover:border-t-primary h-full border-t-4 border-t-transparent transition-all hover:-translate-y-1 hover:shadow-lg">
									<CardHeader className="pb-2">
										<div className="mb-2 flex items-center justify-between">
											<div
												className={`bg-muted/50 rounded-lg p-2 ${program.color}`}
											>
												<Icon className="h-6 w-6" />
											</div>
											<Badge
												variant="secondary"
												className="text-xs font-medium"
											>
												{program.age}
											</Badge>
										</div>
										<CardTitle className="text-xl">{program.title}</CardTitle>
									</CardHeader>
									<CardContent>
										<p className="text-muted-foreground text-sm leading-relaxed">
											{program.description}
										</p>
									</CardContent>
								</Card>
							</motion.div>
						);
					})}
				</motion.div>
			</div>
		</section>
	);
}
