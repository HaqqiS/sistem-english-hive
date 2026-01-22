"use client";

import KpiCards from "@/app/_components/views/admin/dashboard/kpi-cards";
import RegistrationChart from "@/app/_components/views/admin/dashboard/registration-chart";
import RevenueChart from "@/app/_components/views/admin/dashboard/revenue-chart";
import ScheduleList from "@/app/_components/views/admin/dashboard/schedule-list";
import CardJatuhTempo from "@/app/_components/views/admin/pembayaran/card-jatuh-tempo";
import CardTagihanLainBelumLunas from "@/app/_components/views/admin/pembayaran/card-tagihan-lain-belum-lunas";

export default function DashboardClientPage() {
	return (
		<div className="space-y-6">
			{/* 1. KPI Cards */}
			<KpiCards />

			{/* 2. Charts Section */}
			<div className="grid gap-4 md:grid-cols-2">
				<RegistrationChart />
				<RevenueChart />
			</div>

			{/* 3. Operational Section */}
			<div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
				{/* Schedule List (1/3 width on large screens) */}
				<ScheduleList />

				{/* Tagihan Jatuh Tempo & Tagihan Lain (2/3 width on large screens) */}
				<div className="col-span-1 space-y-4 lg:col-span-2">
					<CardJatuhTempo />
					<CardTagihanLainBelumLunas />
				</div>
			</div>
		</div>
	);
}
