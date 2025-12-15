"use client";

import { ScrollAnimation } from "@/app/_components/shared/scroll-animation";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
	{
		question: "Apakah ada trial class?",
		answer:
			"Ya, kami menyediakan 1x free trial class untuk siswa baru. Anda bisa merasakan metode pembelajaran kami sebelum memutuskan untuk mendaftar.",
	},
	{
		question:
			"Berapa lama waktu yang dibutuhkan untuk bisa lancar berbahasa Inggris?",
		answer:
			"Waktu yang dibutuhkan berbeda untuk setiap individu tergantung level awal, intensitas belajar, dan praktik. Rata-rata siswa kami mengalami peningkatan signifikan dalam 3-6 bulan dengan konsisten mengikuti kelas.",
	},
	{
		question: "Bagaimana sistem pembayarannya?",
		answer:
			"Pembayaran dapat dilakukan bulanan atau paket (3/12 bulan) dengan harga lebih hemat. Kami menerima transfer bank, e-wallet.",
	},
	{
		question: "Apakah ada kelas online?",
		answer:
			"Ya, kami menyediakan kelas online dan offline. Untuk kelas online menggunakan platform Zoom dengan kualitas audio-visual yang baik dan materi interaktif.",
	},
];

export default function FAQ() {
	return (
		<section className="bg-background flex min-h-screen items-center px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
			<div className="mx-auto w-full max-w-3xl">
				{/* Header Animasi */}
				<ScrollAnimation
					variant="fadeUp"
					className="mb-12 text-center"
					viewportAmount={0.5}
					once={true}
				>
					<h2 className="text-foreground mb-4 text-3xl font-bold text-balance sm:text-4xl lg:text-5xl">
						Pertanyaan yang Sering Diajukan
					</h2>
					<p className="text-muted-foreground text-lg">
						Temukan jawaban untuk pertanyaan umum tentang English Hive
					</p>
				</ScrollAnimation>

				<Accordion type="single" collapsible className="w-full space-y-4">
					{faqs.map((faq, index) => (
						<ScrollAnimation
							key={faq.question}
							variant="fadeUp"
							delay={index * 0.1}
							viewportAmount={0.5}
							once={true}
						>
							<AccordionItem
								value={`item-${index}`}
								className="border-border rounded-lg border px-4"
							>
								<AccordionTrigger className="hover:text-primary text-left font-medium transition-colors">
									{faq.question}
								</AccordionTrigger>
								<AccordionContent className="text-muted-foreground">
									{faq.answer}
								</AccordionContent>
							</AccordionItem>
						</ScrollAnimation>
					))}
				</Accordion>
			</div>
		</section>
	);
}
