"use client";

import {
	BookOpen,
	CreditCard,
	type LucideIcon,
	UserCheck,
	Users,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDashboard } from "@/hooks/useDashboard";
import { toRupiah } from "@/utils/toRupiah";

interface KpiCardProps {
	title: string;
	value: string | number;
	icon: LucideIcon;
	desc?: string;
	isLoading?: boolean;
}

function KpiCard({ title, value, icon: Icon, desc, isLoading }: KpiCardProps) {
	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle className="text-sm font-medium">{title}</CardTitle>
				<Icon className="text-muted-foreground h-4 w-4" />
			</CardHeader>
			<CardContent>
				{isLoading ? (
					<div className="h-7 w-20 animate-pulse rounded bg-slate-200" />
				) : (
					<div className="text-2xl font-bold">{value}</div>
				)}
				{desc && <p className="text-muted-foreground text-xs">{desc}</p>}
			</CardContent>
		</Card>
	);
}

export default function KpiCards() {
	const { kpiStats } = useDashboard();
	const { data, isLoading } = kpiStats;

	return (
		<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
			<KpiCard
				title="Total Murid Aktif"
				value={data?.totalMuridAktif ?? 0}
				icon={Users}
				desc="Siswa status aktif"
				isLoading={isLoading}
			/>
			<KpiCard
				title="Kelas Aktif"
				value={data?.totalKelasAktif ?? 0}
				icon={BookOpen}
				desc="Total kelas berjalan"
				isLoading={isLoading}
			/>
			<KpiCard
				title="Pending Payment"
				value={toRupiah(data?.pendingPayment ?? 0)}
				icon={CreditCard}
				desc="Potensi pendapatan"
				isLoading={isLoading}
			/>
			<KpiCard
				title="Kehadiran Hari Ini"
				value={`${data?.attendanceRate ?? 0}%`}
				icon={UserCheck}
				desc="Rata-rata kehadiran sesi hari ini"
				isLoading={isLoading}
			/>
		</div>
	);
}
