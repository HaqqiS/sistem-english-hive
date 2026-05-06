import "@/styles/globals.css";

import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "@/components/ui/sonner";
import { auth } from "@/server/auth";
import { TRPCReactProvider } from "@/trpc/react";
import { ThemeProvider } from "./_components/providers/theme-provider";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://englishhive.com";

export const metadata: Metadata = {
	metadataBase: new URL(BASE_URL),
	title: {
		template: "%s | English Hive",
		default: "English Hive – Kursus Bahasa Inggris Terbaik",
	},
	description:
		"Kursus bahasa Inggris interaktif dengan tutor berpengalaman di English Hive. Tingkatkan kemampuan speaking, listening, reading, dan writing dengan metode pembelajaran yang menyenangkan dan terbukti efektif.",
	keywords: [
		"kursus bahasa inggris",
		"les bahasa inggris",
		"english course",
		"belajar bahasa inggris",
		"kursus bahasa inggris anak",
		"english hive",
		"kursus speaking",
		"kursus listening",
		"kursus grammar",
		"english for kids",
	],
	authors: [{ name: "English Hive" }],
	creator: "English Hive",
	publisher: "English Hive",
	robots: {
		index: true,
		follow: true,
		googleBot: {
			index: true,
			follow: true,
			"max-video-preview": -1,
			"max-image-preview": "large",
			"max-snippet": -1,
		},
	},
	alternates: {
		canonical: BASE_URL,
	},
	openGraph: {
		type: "website",
		locale: "id_ID",
		url: BASE_URL,
		siteName: "English Hive",
		title: "English Hive – Kursus Bahasa Inggris Terbaik",
		description:
			"Kursus bahasa Inggris interaktif dengan tutor berpengalaman. Tingkatkan kemampuan speaking, listening, reading, dan writing Anda.",
		images: [
			{
				url: "/og-image.webp",
				width: 1200,
				height: 630,
				alt: "English Hive – Kursus Bahasa Inggris",
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		title: "English Hive – Kursus Bahasa Inggris Terbaik",
		description:
			"Kursus bahasa Inggris interaktif dengan tutor berpengalaman. Tingkatkan kemampuan speaking, listening, reading, dan writing Anda.",
		images: ["/og-image.webp"],
	},
	icons: [
		{ rel: "icon", url: "/favicon.ico" },
		{
			rel: "icon",
			url: "/favicon-16x16.png",
			sizes: "16x16",
			type: "image/png",
		},
		{
			rel: "icon",
			url: "/favicon-32x32.png",
			sizes: "32x32",
			type: "image/png",
		},
		{ rel: "apple-touch-icon", url: "/apple-touch-icon.png" },
	],
};

const geist = Geist({
	subsets: ["latin"],
	variable: "--font-geist-sans",
});
// const _geistMono = Geist_Mono({ subsets: ["latin"] });

export default async function RootLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	const session = await auth();

	// console.log("Session in layout:", session);

	return (
		<html
			lang="id"
			className={`${geist.variable} scroll-smooth`}
			suppressHydrationWarning
		>
			<body>
				<SessionProvider session={session}>
					<TRPCReactProvider>
						<ThemeProvider
							attribute="class"
							defaultTheme="system"
							enableSystem
							disableTransitionOnChange
						>
							<Toaster />
							{children}
						</ThemeProvider>
					</TRPCReactProvider>
				</SessionProvider>
			</body>
		</html>
	);
}
