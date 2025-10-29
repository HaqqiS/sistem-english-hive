import Link from "next/link";

import { LatestPost } from "@/app/_components/shared/post";
import { auth } from "@/server/auth";
import { api, HydrateClient } from "@/trpc/server";
import Navbar from "./_components/_home/navbar";
import Hero from "./_components/_home/hero";
import MarqueeBanner from "./_components/_home/marquee_banner";
import Features from "./_components/_home/features";
import About from "./_components/_home/about";
import Programs from "./_components/_home/programs";
import Pricing from "./_components/_home/pricing";
import Schedule from "./_components/_home/schedule";
import Testimonials from "./_components/_home/testimonials";
import FAQ from "./_components/_home/faq";
import Registration from "./_components/_home/registration";
import CTA from "./_components/_home/cta";
import Footer from "./_components/_home/footer";
import FloatingButtons from "@/app/_components/_home/floating_buttons";

export default async function Home() {
  const session = await auth();

  if (session?.user) {
    void api.post.getLatest.prefetch();
  }

  return (
    <HydrateClient>
      {/* <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[hsl(167,72%,50%)] to-[hsl(167,40%,40%)] text-white">
        <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
          <p className="text-3xl"> test</p>
        </div>
      </main> */}
      <main className="bg-background min-h-screen">
        <Navbar />
        <Hero />
        <MarqueeBanner />
        <Features />
        <About />
        <Programs />
        <Pricing />
        <Schedule />
        <Testimonials />
        <FAQ />
        <Registration />
        <CTA />
        <Footer />
        <FloatingButtons />
      </main>
    </HydrateClient>
  );
}
