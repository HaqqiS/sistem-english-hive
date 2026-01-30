"use client";

import Image from "next/image";
import { ScrollAnimation } from "@/app/_components/shared/scroll-animation";
import { Card, CardContent } from "@/components/ui/card";

const stats = [
	{ number: "500+", label: "Siswa Aktif" },
	{ number: "15+", label: "Tutor Ahli" },
	{ number: "95%", label: "Puas" },
	{ number: "2+", label: "Tahun" },
];

export default function About() {
	return (
		<section id="about" className="bg-muted/30 overflow-hidden py-20">
			<div className="mx-auto w-full max-w-7xl px-6 lg:px-8">
				<div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
					{/* Gambar: Muncul dari Kiri */}
					<ScrollAnimation
						variant="fadeLeft"
						className="relative h-64 w-full lg:h-96"
						once={true}
					>
						<div className="bg-primary/10 absolute inset-0 -z-10 scale-105 rotate-3 rounded-2xl" />
						<Image
							src="/about_team.webp"
							alt="English Hive Team"
							fill
							className="rounded-2xl object-cover shadow-xl"
						/>
						<div className="bg-primary text-primary-foreground absolute -right-4 -bottom-4 animate-bounce rounded-lg px-6 py-3 text-sm font-semibold shadow-lg">
							{stats[3]?.number} Tahun Pengalaman
						</div>
					</ScrollAnimation>

					{/* Teks: Muncul dari Kanan */}
					<ScrollAnimation
						variant="fadeRight"
						className="space-y-6"
						once={true}
					>
						<h2 className="text-3xl font-bold text-balance sm:text-4xl lg:text-4xl">
							Tentang <span className="text-primary">English Hive</span>
						</h2>

						<div className="text-muted-foreground space-y-4 text-lg leading-relaxed">
							<p>
								Kami berdedikasi membantu siswa dari berbagai latar belakang
								mencapai kemampuan bahasa Inggris optimal.
							</p>
							<p>
								Metode inovatif kami didukung oleh tutor ahli yang siap
								membimbing setiap langkah Anda menuju kefasihan.
							</p>
						</div>

						{/* Stats Grid: Zoom In Subtle */}
						<div className="grid grid-cols-2 gap-4 pt-4">
							{stats.map((stat, index) => (
								<ScrollAnimation
									key={stat.label}
									variant="zoomIn"
									delay={index * 0.1}
									once={true}
								>
									<Card className="bg-background hover:border-primary transition-colors">
										<CardContent className="pt-4 text-center">
											<div className="text-primary text-2xl font-bold">
												{stat.number}
											</div>
											<div className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
												{stat.label}
											</div>
										</CardContent>
									</Card>
								</ScrollAnimation>
							))}
						</div>
					</ScrollAnimation>
				</div>
			</div>
		</section>
	);
}
