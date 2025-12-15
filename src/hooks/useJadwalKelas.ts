"use client";

import { Hari } from "@prisma/client";
import { toast } from "sonner";
import { api } from "@/trpc/react";
import type {
	TypeJadwalHariIni,
	TypeJadwalKelas,
} from "@/types/jadwalKelas.type";

interface useJadwalKelasOptions {
	// Query options
	enableQueryAll?: boolean;
	enableQueryHariIni?: boolean;
	enableQueryMatrix?: boolean;

	initialData?: TypeJadwalKelas[];
	initialDataJadwalHariIni?: TypeJadwalHariIni;

	// Mutation callbacks
	onSuccessCreate?: () => void;
	onSuccessUpdate?: () => void;
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

	const getAllJadwal = api.jadwalKelas.getAll.useQuery(
		{ cabangId: cabangIdPayload },
		{
			enabled: options?.enableQueryAll ?? false,
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
			apiUtils.jadwalKelas.getAll.invalidate(),
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
		onSuccess: async () => {
			await invalidateJadwal();
			await apiUtils.jadwalKelas.getJadwalHariIniForGuru.invalidate();
			options?.onSuccessUpdate?.();
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

	return {
		// Query results
		dataJadwalHariIni: jadwalHariIniQuery.data,
		isLoadingJadwalHariIni: jadwalHariIniQuery.isLoading,
		isErrorJadwalHariIni: jadwalHariIniQuery.isError,
		errorJadwalHariIni: jadwalHariIniQuery.error,
		refetchJadwalHariIni: jadwalHariIniQuery.refetch,

		dataJadwal: getAllJadwal.data,
		isLoadingDataJadwal: getAllJadwal.isLoading,
		isErrorDataJadwal: getAllJadwal.isError,
		errorDataJadwal: getAllJadwal.error,

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
