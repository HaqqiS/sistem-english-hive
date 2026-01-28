"use client";

import { KategoriTagihan } from "@prisma/client";
import KpiCards from "@/app/_components/views/admin/dashboard/kpi-cards";
import RegistrationChart from "@/app/_components/views/admin/dashboard/registration-chart";
import RevenueChart from "@/app/_components/views/admin/dashboard/revenue-chart";
import ScheduleList from "@/app/_components/views/admin/dashboard/schedule-list";
import SumberInfoChart from "@/app/_components/views/admin/dashboard/sumber-info-chart";
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
				<SumberInfoChart />
				<ScheduleList />
			</div>

			{/* 3. Operational Section */}
			<div className="grid grid-cols-1 gap-4">
				{/* Tagihan Jatuh Tempo & Tagihan Lain (full width on large screens) */}
				<div className="col-span-1 space-y-4">
					<CardJatuhTempo />
					<CardTagihanLainBelumLunas
						title="Tagihan Buku Belum Lunas"
						kategori={KategoriTagihan.BUKU}
						className="border-l-orange-500"
					/>
					<CardTagihanLainBelumLunas
						title="Tagihan Register Belum Lunas"
						kategori={KategoriTagihan.REGISTRASI}
						className="border-l-blue-500"
					/>
				</div>
			</div>
		</div>
	);
}
