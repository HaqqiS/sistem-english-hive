import { auth } from "@/server/auth";
import { api, HydrateClient } from "@/trpc/server";
import Navbar from "./_components/_home/navbar";
import Hero from "./_components/_home/hero";
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
      <main className="bg-background min-h-screen">
        <Navbar />
        <Hero />
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
