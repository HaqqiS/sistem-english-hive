import type { Metadata } from "next";
import AdminFinalReportClient from "@/app/_components/views/admin/final-report/admin-final-report-client";
import { HydrateClient } from "@/trpc/server";

export const metadata: Metadata = {
	title: "Final Report Approval",
};

export default function AdminFinalReportPage() {
	return (
		<HydrateClient>
			<AdminFinalReportClient />
		</HydrateClient>
	);
}
