"use client";

import KpiCards from "@/app/_components/views/admin/dashboard/kpi-cards";
import PrediksiPendapatanCard from "@/app/_components/views/admin/dashboard/prediksi-pendapatan-card";
import RegistrationChart from "@/app/_components/views/admin/dashboard/registration-chart";
import RevenueChart from "@/app/_components/views/admin/dashboard/revenue-chart";
import ScheduleList from "@/app/_components/views/admin/dashboard/schedule-list";
import SumberInfoChart from "@/app/_components/views/admin/dashboard/sumber-info-chart";

export default function DashboardClientPage() {
	return (
		<div className="space-y-6">
			{/* 1. KPI Cards */}
			<KpiCards />

			{/* 2. Charts Section (kolom kanan di sebelah Sumber Info sengaja dikosongkan dulu) */}
			<div className="grid gap-4 md:grid-cols-2">
				<RegistrationChart />
				<RevenueChart />
				<SumberInfoChart />
			</div>

			{/* 3. Jadwal Hari Ini (termasuk event Middle/Final Test): full width */}
			<ScheduleList />

			{/* 4. Estimasi Pendapatan Bulan Ini: full width */}
			<PrediksiPendapatanCard />
		</div>
	);
}
