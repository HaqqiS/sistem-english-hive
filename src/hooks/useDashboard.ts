import { useGlobalCabangStore } from "@/store/useGlobalCabangStore";
import { api } from "@/trpc/react";

export const useDashboard = () => {
	const { activeCabangId } = useGlobalCabangStore();

	// Konversi "ALL" menjadi undefined agar backend tidak melakukan filtering
	const payloadCabangId =
		activeCabangId === "ALL" || !activeCabangId ? undefined : activeCabangId;

	const kpiStats = api.dashboard.getKpiStats.useQuery({
		cabangId: payloadCabangId,
	});
	const revenueTrend = api.dashboard.getRevenueTrend.useQuery({
		cabangId: payloadCabangId,
	});
	const prediksiPendapatan =
		api.dashboard.getPrediksiPendapatanBulanan.useQuery({
			cabangId: payloadCabangId,
		});
	const sumberInfoDistribution =
		api.dashboard.getSumberInfoDistribution.useQuery({
			cabangId: payloadCabangId,
		});
	const todaySchedule = api.dashboard.getTodaySchedule.useQuery({
		cabangId: payloadCabangId,
	});

	const utils = api.useUtils();

	const invalidateDashboard = async () => {
		await utils.dashboard.invalidate();
	};

	return {
		kpiStats,
		revenueTrend,
		prediksiPendapatan,
		sumberInfoDistribution,
		todaySchedule,
		invalidateDashboard,
	};
};