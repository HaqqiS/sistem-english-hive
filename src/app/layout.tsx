import "@/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";

import { TRPCReactProvider } from "@/trpc/react";
import { ThemeProvider } from "./_components/providers/theme-provider";
import { auth } from "@/server/auth";
import { Toaster } from "@/components/ui/sonner";
import { SessionProvider } from "next-auth/react";

export const metadata: Metadata = {
	title: {
		template: "%s | English Hive", // %s akan diganti dengan title dari setiap page
		default: "English Hive", // Title default jika page tidak punya metadata
	},
	description:
		"Kursus bahasa Inggris interaktif dengan tutor berpengalaman. Tingkatkan kemampuan speaking, listening, reading, dan writing Anda dengan metode pembelajaran yang menyenangkan.",
	icons: [{ rel: "icon", url: "/favicon.ico" }],
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
			lang="en"
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
