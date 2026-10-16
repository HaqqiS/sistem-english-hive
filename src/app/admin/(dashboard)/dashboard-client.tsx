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

			{/* 2. Charts Section */}
			<div className="grid gap-4 md:grid-cols-2">
				<RegistrationChart />
				<RevenueChart />
				<SumberInfoChart />
				{/* Jadwal Hari Ini: ambil 50% (berdampingan dengan Sumber Info) */}
				<ScheduleList />
			</div>

			{/* Estimasi Pendapatan Bulan Ini: full width di bawah Jadwal Hari Ini */}
			<PrediksiPendapatanCard />
		</div>
	);
}
