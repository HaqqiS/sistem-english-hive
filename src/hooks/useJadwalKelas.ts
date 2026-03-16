"use client";

import { Hari } from "@prisma/client";
import { toast } from "sonner";
import { api } from "@/trpc/react";
import type {
	TypeJadwalHariIni,
	TypeJadwalKelas,
	TypeUpdateJadwalResponse,
} from "@/types/jadwalKelas.type";

interface useJadwalKelasOptions {
	// Query options
	enableQueryAllRunning?: boolean;
	enableQueryAllTrial?: boolean;
	enableQueryAllWaiting?: boolean;
	enableQueryHariIni?: boolean;
	enableQueryMatrix?: boolean;

	initialData?: TypeJadwalKelas[];
	initialDataJadwalHariIni?: TypeJadwalHariIni;

	// Mutation callbacks
	onSuccessCreate?: () => void;
	onSuccessUpdate?: (data?: TypeUpdateJadwalResponse) => void;
	onSuccessDelete?: () => void;

	filterCabang?: string;
	hari?: Hari;
	guruId?: string;
}

/**
 * Custom hook untuk mengelola Ruang (Queries + Mutations)
 *
 */
export function useJadwalKelas(options?: useJadwalKelasOptions) {
	const apiUtils = api.useUtils();
	const cabangIdPayload =
		options?.filterCabang !== "ALL" ? options?.filterCabang : undefined;

	// ========== QUERIES ==========

	const jadwalHariIniQuery = api.jadwalKelas.getJadwalHariIniForGuru.useQuery(
		{ guruId: options?.guruId }, // Kirim guruId ke backend (bisa undefined)
		{
			enabled: options?.enableQueryHariIni ?? true,
			initialData: options?.initialDataJadwalHariIni,
			refetchOnWindowFocus: true, // Agar realtime jika ada perubahan
		},
	);

	const getAllJadwalRunning = api.jadwalKelas.getAllRunning.useQuery(
		{ cabangId: cabangIdPayload },
		{
			enabled: options?.enableQueryAllRunning ?? false,
			initialData: options?.initialData,
		},
	);

	const getAllJadwalTrial = api.jadwalKelas.getAllTrial.useQuery(
		{ cabangId: cabangIdPayload },
		{
			enabled: options?.enableQueryAllTrial ?? false,
			initialData: options?.initialData,
		},
	);

	const getAllJadwalWaiting = api.jadwalKelas.getAllWaiting.useQuery(
		{ cabangId: cabangIdPayload },
		{
			enabled: options?.enableQueryAllWaiting ?? false,
			initialData: options?.initialData,
		},
	);

	const getScheduleMatrix = api.jadwalKelas.getScheduleMatrix.useQuery(
		{
			cabangId: cabangIdPayload,
			hari: options?.hari ?? Hari.SENIN,
		},
		{
			// Hanya jalankan jika flag enable nyala DAN cabangId sudah terpilih
			enabled: options?.enableQueryMatrix ?? false,
			refetchOnWindowFocus: false, // Tidak perlu refetch agresif untuk matrix besar
		},
	);

	const invalidateJadwal = async () => {
		await Promise.all([
			apiUtils.jadwalKelas.getAllRunning.invalidate(),
			apiUtils.jadwalKelas.getAllTrial.invalidate(),
			apiUtils.jadwalKelas.getAllWaiting.invalidate(),
			apiUtils.jadwalKelas.getScheduleMatrix.invalidate(),
		]);
	};

	// ========== MUTATIONS ==========

	// CREATE
	const createMutation = api.jadwalKelas.create.useMutation({
		onSuccess: async () => {
			await invalidateJadwal();
			await apiUtils.jadwalKelas.getJadwalHariIniForGuru.invalidate();
			toast.success("Jadwal baru berhasil ditambahkan");
			options?.onSuccessCreate?.();
		},
		onError: (error) => {
			toast.error(`Gagal membuat jadwal: ${error.message}`);
		},
	});

	// UPDATE

	const updateMutation = api.jadwalKelas.update.useMutation({
		onSuccess: async (data) => {
			await invalidateJadwal();
			await apiUtils.jadwalKelas.getJadwalHariIniForGuru.invalidate();

			// Jika terjadi conflict swap, jangan tutup drawer/toast success, biarkan UI Handle
			if (data && "isConflict" in data && data.isConflict) {
				options?.onSuccessUpdate?.(data as TypeUpdateJadwalResponse);
				return;
			}

			toast.success("Jadwal kelas berhasil diperbarui");
			options?.onSuccessUpdate?.(data as TypeUpdateJadwalResponse);
		},
		onError: (error) => {
			toast.error(`Gagal mengupdate Jadwal: ${error.message}`);
		},
	});

	// DELETE
	const deleteMutationCustom = api.jadwalKelas.delete.useMutation({
		onSuccess: async () => {
			await invalidateJadwal();
			await apiUtils.jadwalKelas.getJadwalHariIniForGuru.invalidate();

			toast.success("Jadwal berhasil dihapus");
			options?.onSuccessDelete?.();
		},
		onError: (error) => {
			toast.error(`Gagal menghapus Jadwal: ${error.message}`);
		},
	});

	// Utils FETCH
	const fetchScheduleMatrix = async (cabangId: string) => {
		return await apiUtils.jadwalKelas.getScheduleMatrix.fetch({
			cabangId,
		});
	};

	return {
		fetchScheduleMatrix,
		// Query results
		dataJadwalHariIni: jadwalHariIniQuery.data,
		isLoadingJadwalHariIni: jadwalHariIniQuery.isLoading,
		isErrorJadwalHariIni: jadwalHariIniQuery.isError,
		errorJadwalHariIni: jadwalHariIniQuery.error,
		refetchJadwalHariIni: jadwalHariIniQuery.refetch,

		dataJadwalRunning: getAllJadwalRunning.data,
		isLoadingDataJadwalRunning: getAllJadwalRunning.isLoading,
		isErrorDataJadwalRunning: getAllJadwalRunning.isError,
		errorDataJadwalRunning: getAllJadwalRunning.error,

		dataJadwalTrial: getAllJadwalTrial.data,
		isLoadingDataJadwalTrial: getAllJadwalTrial.isLoading,
		isErrorDataJadwalTrial: getAllJadwalTrial.isError,
		errorDataJadwalTrial: getAllJadwalTrial.error,

		dataJadwalWaiting: getAllJadwalWaiting.data,
		isLoadingDataJadwalWaiting: getAllJadwalWaiting.isLoading,
		isErrorDataJadwalWaiting: getAllJadwalWaiting.isError,
		errorDataJadwalWaiting: getAllJadwalWaiting.error,

		dataMatrix: getScheduleMatrix.data,
		isLoadingMatrix: getScheduleMatrix.isLoading,
		isErrorMatrix: getScheduleMatrix.isError,
		isRefetchingMatrix: getScheduleMatrix.isFetching,
		errorMatrix: getScheduleMatrix.error,
		refetchMatrix: getScheduleMatrix.refetch,

		// Mutations
		mutations: {
			create: {
				mutate: createMutation.mutate,
				mutateAsync: createMutation.mutateAsync,
				isPending: createMutation.isPending,
			},
			update: {
				mutate: updateMutation.mutate,
				mutateAsync: updateMutation.mutateAsync,
				isPending: updateMutation.isPending,
			},
			delete: {
				mutate: deleteMutationCustom.mutate,
				mutateAsync: deleteMutationCustom.mutateAsync,
				isPending: deleteMutationCustom.isPending,
			},
		},

		// Utils untuk manual invalidation jika perlu
		invalidate: invalidateJadwal,
	};
}
