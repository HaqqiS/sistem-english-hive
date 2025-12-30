"use client";

import {
	BookOpen,
	CreditCard,
	Loader2,
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
	details?: { label: string; value: string | number; color?: string }[];
}

function KpiCard({
	title,
	value,
	icon: Icon,
	desc,
	isLoading,
	details,
}: KpiCardProps) {
	return (
		<Card className="flex flex-col justify-between">
			<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle className="text-sm font-medium">{title}</CardTitle>
				<Icon className="text-muted-foreground h-4 w-4" />
			</CardHeader>
			<CardContent>
				{isLoading ? (
					<div className="flex items-center">
						<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
					</div>
				) : (
					<div className="space-y-3">
						<div className="text-2xl font-bold">{value}</div>
						{details && details.length > 0 && (
							<div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs sm:grid-cols-3">
								{details.map((item) => (
									<div
										key={item.label}
										className="flex flex-col border-l-2 pl-2"
										style={{ borderColor: item.color ?? "#e5e7eb" }}
									>
										<span className="text-muted-foreground text-[10px] uppercase">
											{item.label}
										</span>
										<span className="font-semibold">{item.value}</span>
									</div>
								))}
							</div>
						)}
						{desc && !details && (
							<p className="text-muted-foreground text-xs">{desc}</p>
						)}
					</div>
				)}
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
				isLoading={isLoading}
				details={[
					{
						label: "Baru",
						value: data?.totalMuridPendaftarBaru ?? 0,
						color: "#3b82f6",
					},
					{
						label: "Trial",
						value: data?.totalMuridTrial ?? 0,
						color: "#f59e0b",
					},
					{
						label: "Waiting",
						value: data?.totalMuridWaiting ?? 0,
						color: "#ef4444",
					},
				]}
			/>
			<KpiCard
				title="Total Kelas"
				value={
					(data?.totalKelasAktif ?? 0) +
					(data?.totalKelasTrial ?? 0) +
					(data?.totalKelasWaiting ?? 0)
				}
				icon={BookOpen}
				isLoading={isLoading}
				details={[
					{
						label: "Running",
						value: data?.totalKelasAktif ?? 0,
						color: "#3b82f6",
					},
					{
						label: "Trial",
						value: data?.totalKelasTrial ?? 0,
						color: "#f59e0b",
					},
					{
						label: "Waiting",
						value: data?.totalKelasWaiting ?? 0,
						color: "#ef4444",
					},
				]}
			/>
			<KpiCard
				title="Total Pending Payment"
				value={toRupiah(
					(data?.pendingPayment ?? 0) +
						((data?.pendingPaymentBuku ?? 0) +
							(data?.pendingPaymentRegistration ?? 0)),
				)}
				icon={CreditCard}
				isLoading={isLoading}
				details={[
					{
						label: "SPP",
						value: toRupiah(data?.pendingPayment ?? 0),
						color: "#ef4444",
					},
					{
						label: "Buku",
						value: toRupiah(data?.pendingPaymentBuku ?? 0),
						color: "#3b82f6",
					},
					{
						label: "Registrasi",
						value: toRupiah(data?.pendingPaymentRegistration ?? 0),
						color: "#10b981",
					},
				]}
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
