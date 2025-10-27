import "@/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";

import { TRPCReactProvider } from "@/trpc/react";
import { ThemeProvider } from "./_components/providers/theme-provider";
import { auth } from "@/server/auth";
import { Toaster } from "@/app/_components/ui/sonner";

export const metadata: Metadata = {
  title: "English Hive",
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
  return (
    <html
      lang="en"
      className={`${geist.variable} scroll-smooth`}
      suppressHydrationWarning
    >
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Toaster />
          <TRPCReactProvider session={session}>{children}</TRPCReactProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
