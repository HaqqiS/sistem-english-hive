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

export default async function Home() {
	await Promise.all([
		api.cabang.getCabangList.prefetch(),
		// api.jadwalKelas.getAll.prefetch(),
	]);

	return (
		<HydrateClient>
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
