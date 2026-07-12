"use client";

import KelasJatuhTempoH14 from "@/app/_components/views/admin/dashboard/kelas-jatuh-tempo-h14";
import KpiCards from "@/app/_components/views/admin/dashboard/kpi-cards";
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
				<ScheduleList />
			</div>

			{/* 3. Operational Section */}
			<div className="grid grid-cols-1 gap-4">
				{/* Kelas dengan tagihan (SPP/Buku/Registrasi) jatuh tempo H-14, dikelompokkan per kelas */}
				<div className="col-span-1 space-y-4">
					<KelasJatuhTempoH14 />
				</div>
			</div>
		</div>
	);
}
