import type { Metadata } from "next";
import FloatingButtons from "@/app/_components/_home/floating_buttons";

import { api, HydrateClient } from "@/trpc/server";
import About from "./_components/_home/about";
import CTA from "./_components/_home/cta";
import FAQ from "./_components/_home/faq";
import Features from "./_components/_home/features";
import Footer from "./_components/_home/footer";
import Hero from "./_components/_home/hero";
// Components
import Navbar from "./_components/_home/navbar";
import Pricing from "./_components/_home/pricing";
import Programs from "./_components/_home/programs";
import Registration from "./_components/_home/registration";
import Schedule from "./_components/_home/schedule";
import Testimonials from "./_components/_home/testimonials";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://englishhive.com";

export const metadata: Metadata = {
	title: "English Hive – Kursus Bahasa Inggris Terbaik & Interaktif",
	description:
		"English Hive menyediakan kursus bahasa Inggris interaktif untuk anak-anak dan dewasa. Bergabung dengan 500+ siswa, dipandu 15+ tutor ahli. Trial class gratis!",
	alternates: {
		canonical: BASE_URL,
	},
};

const jsonLd = {
	"@context": "https://schema.org",
	"@graph": [
		{
			"@type": ["EducationalOrganization", "LocalBusiness"],
			"@id": `${BASE_URL}/#organization`,
			name: "English Hive",
			description:
				"Kursus bahasa Inggris interaktif dengan tutor berpengalaman untuk semua usia.",
			url: BASE_URL,
			logo: `${BASE_URL}/favicon.ico`,
			image: `${BASE_URL}/og-image.webp`,
			hasOfferCatalog: {
				"@type": "OfferCatalog",
				name: "Program Kursus Bahasa Inggris",
				itemListElement: [
					{
						"@type": "Course",
						name: "TinyTods",
						description:
							"Pengenalan Bahasa Inggris melalui lagu, gerak, dan permainan sensorik.",
					},
					{
						"@type": "Course",
						name: "TinyStars",
						description:
							"Fokus pada interaksi sosial dan kemandirian melalui permainan edukatif.",
					},
					{
						"@type": "Course",
						name: "PreLittleStar",
						description:
							"Membangun kosakata dasar dan kepercayaan diri untuk berbicara.",
					},
					{
						"@type": "Course",
						name: "LittleStar",
						description:
							"Fokus pada phonics dasar dan pembentukan kalimat sederhana.",
					},
					{
						"@type": "Course",
						name: "RisingStar",
						description:
							"Penguatan grammar dasar dan reading comprehension awal.",
					},
					{
						"@type": "Course",
						name: "Elementary",
						description:
							"Program intensif mencakup 4 skill utama: Speaking, Listening, Reading, Writing.",
					},
				],
			},
			openingHoursSpecification: {
				"@type": "OpeningHoursSpecification",
				dayOfWeek: [
					"Monday",
					"Tuesday",
					"Wednesday",
					"Thursday",
					"Friday",
					"Saturday",
				],
				opens: "09:00",
				closes: "20:00",
			},
		},
		{
			"@type": "FAQPage",
			"@id": `${BASE_URL}/#faq`,
			mainEntity: [
				{
					"@type": "Question",
					name: "Apakah ada trial class?",
					acceptedAnswer: {
						"@type": "Answer",
						text: "Ya, kami menyediakan 1x free trial class untuk siswa baru. Anda bisa merasakan metode pembelajaran kami sebelum memutuskan untuk mendaftar.",
					},
				},
				{
					"@type": "Question",
					name: "Berapa lama waktu yang dibutuhkan untuk bisa lancar berbahasa Inggris?",
					acceptedAnswer: {
						"@type": "Answer",
						text: "Rata-rata siswa kami mengalami peningkatan signifikan dalam 3-6 bulan dengan konsisten mengikuti kelas.",
					},
				},
				{
					"@type": "Question",
					name: "Bagaimana sistem pembayarannya?",
					acceptedAnswer: {
						"@type": "Answer",
						text: "Pembayaran dapat dilakukan per 8x pertemuan atau langsung melunaskan 1 level (24x pertemuan). Kami menerima transfer bank, e-wallet, dan tunai.",
					},
				},
				{
					"@type": "Question",
					name: "Apakah ada kelas online?",
					acceptedAnswer: {
						"@type": "Answer",
						text: "Ya, kami menyediakan kelas online dan offline. Kelas online menggunakan platform Zoom dengan kualitas audio-visual yang baik dan materi interaktif.",
					},
				},
			],
		},
		{
			"@type": "WebSite",
			"@id": `${BASE_URL}/#website`,
			url: BASE_URL,
			name: "English Hive",
			description: "Kursus bahasa Inggris interaktif terbaik",
			potentialAction: {
				"@type": "SearchAction",
				target: `${BASE_URL}/?s={search_term_string}`,
				"query-input": "required name=search_term_string",
			},
		},
	],
};

export default async function Home() {
	await Promise.all([api.cabang.getCabangList.prefetch()]);

	return (
		<HydrateClient>
			{/* JSON-LD Structured Data for Rich Snippets */}
			<script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
			<main className="bg-background selection:bg-accent selection:text-accent-foreground min-h-screen overflow-x-hidden">
				<Navbar />

				<Hero />

				<Features />

				<Programs />

				<Pricing />

				<Schedule />

				<Testimonials />

				<About />

				<FAQ />

				<div id="registration">
					<Registration />
				</div>

				<CTA />

				<Footer />
				<FloatingButtons />
			</main>
		</HydrateClient>
	);
}
