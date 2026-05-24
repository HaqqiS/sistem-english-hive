import type { Metadata } from "next";
import FinalReportForm from "@/app/_components/views/guru/final-report/final-report-form";
import { HydrateClient } from "@/trpc/server";

export const metadata: Metadata = {
	title: "Final Report",
};

export default function GuruFinalReportPage() {
	return (
		<HydrateClient>
			<FinalReportForm />
		</HydrateClient>
	);
}
