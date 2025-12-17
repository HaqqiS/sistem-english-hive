"use client";
import { keepPreviousData, skipToken } from "@tanstack/react-query";
import type { PaginationState, SortingState } from "@tanstack/react-table";
import { toast } from "sonner";
import { api } from "@/trpc/react";
import type {
	TypeAbsensiGuruHistory,
	TypeAbsensiGuruPaginated,
} from "@/types/absenGuru.type";

interface UseGuruOptions {
	// Query options
	enableQuery?: boolean;
	initialDataAbsensi?: TypeAbsensiGuruPaginated;
	initialDataHistory?: TypeAbsensiGuruHistory;

	// Mutation callbacks
	onSuccessCreate?: () => void;
	onSuccessStartSesi?: (newSesiId: string, isFinished: boolean) => void;
	onSuccessUpdate?: () => void;
	onSuccessUpdateStatus?: () => void;
	onSuccessDelete?: () => void;

	guruId?: string;
	month?: string;
	pagination?: PaginationState;
	sorting?: SortingState; // Add sorting
	searchFilter?: string;
	filterCabang?: string;
}

export function useAbsenGuru(options?: UseGuruOptions) {
	const apiUtils = api.useUtils();
	const pageIndex = options?.pagination?.pageIndex ?? 0;
	const pageSize = options?.pagination?.pageSize ?? 10;
	const sorting = options?.sorting; // Get sorting
	const guruId = options?.guruId;
	const month = options?.month;
	const searchFilter = options?.searchFilter;
	const cabangIdPayload =
		options?.filterCabang !== "ALL" ? options?.filterCabang : undefined;

	// ========== QUERIES ==========

	const getAllAbsensiGuruQuery = api.absenGuru.getAllAbsensi.useQuery(
		{
			pageIndex,
			pageSize,
			search: searchFilter,
			month,
			cabangId: cabangIdPayload,
			sorting, // Pass sorting
		},
		{
			enabled: !!options?.pagination,
			initialData: options?.initialDataAbsensi,
			placeholderData: keepPreviousData,
		},
	);

	const getHistoryQuery = api.absenGuru.getHistoryByGuruId.useQuery(
		guruId && month ? { guruId, month, cabangId: cabangIdPayload } : skipToken,
		{
			enabled: !!guruId && !!month,
			initialData: options?.initialDataHistory,
			refetchOnWindowFocus: false,
		},
	);

	const fetchExportData = async () => {
		return await apiUtils.absenGuru.getForExport.fetch({
			search: searchFilter,
			month,
			cabangId: cabangIdPayload,
		});
	};

	const fetchHistoryExport = async () => {
		if (!guruId || !month) return [];

		// Menggunakan fetch() dari router yang sudah ada (getHistoryByGuruId)
		return await apiUtils.absenGuru.getHistoryByGuruId.fetch({
			guruId,
			month,
			cabangId: cabangIdPayload,
		});
	};

	const invalidateData = async () => {
		await apiUtils.absenGuru.getAllAbsensi.invalidate();
	};

	// ========== MUTATIONS ==========

	// CREATE
	const startSesiMutation = api.absenGuru.createSesiAndAbsensi.useMutation({
		onSuccess: async (data) => {
			// Penting: Refresh jadwal di dashboard agar tombol berubah jadi "Lanjut Sesi"
			await apiUtils.jadwalKelas.getJadwalHariIniForGuru.invalidate();
			await apiUtils.absenGuru.getAllAbsensi.invalidate();

			if (data.isFinished) {
				toast.success(
					"Selamat! Kelas ini telah menyelesaikan semua pertemuan (Lulus Level).",
				);
			} else {
				toast.success("Sesi berhasil dimulai!");
			}

			// Teruskan status isFinished ke komponen UI
			if (options?.onSuccessStartSesi) {
				options.onSuccessStartSesi(data.newSesiId, data.isFinished);
			}
			options?.onSuccessCreate?.();
		},
		onError: (error) => {
			toast.error(`Gagal memulai sesi: ${error.message}`);
		},
	});

	// UPDATE
	const updateStatusMutation = api.absenGuru.verifyAbsensi.useMutation({
		onSuccess: async () => {
			await apiUtils.absenGuru.getAllAbsensi.invalidate();
			toast.success("Status verifikasi berhasil diupdate");
			options?.onSuccessUpdateStatus?.();
		},
		onError: (error) => {
			toast.error(`Gagal verifikasi absensi: ${error.message}`);
		},
	});

	const updateAbsensiMutation = api.absenGuru.updateAbsenGuru.useMutation({
		onSuccess: async () => {
			await apiUtils.absenGuru.getAllAbsensi.invalidate();
			toast.success("Absensi berhasil diupdate");
			options?.onSuccessUpdate?.();
		},
		onError: (error) => {
			toast.error(`Gagal mengupdate absensi: ${error.message}`);
		},
	});

	// DELETE
	const deleteMutation = api.absenGuru.deleteAbsenGuru.useMutation({
		onSuccess: async () => {
			await apiUtils.absenGuru.getAllAbsensi.invalidate();
			toast.success("Absensi berhasil dihapus");
			options?.onSuccessDelete?.();
		},
		onError: (error) => {
			toast.error(`Gagal menghapus absensi: ${error.message}`);
		},
	});

	return {
		// Query results

		data: getAllAbsensiGuruQuery.data?.data ?? [],
		pageCount: getAllAbsensiGuruQuery.data?.pageCount ?? 0,
		totalRows: getAllAbsensiGuruQuery.data?.total ?? 0,
		isLoading: getAllAbsensiGuruQuery.isLoading,
		isFetching: getAllAbsensiGuruQuery.isFetching,
		isError: getAllAbsensiGuruQuery.isError,
		error: getAllAbsensiGuruQuery.error,

		dataHistory: getHistoryQuery.data,
		isLoadingHistory: getHistoryQuery.isLoading,
		isErrorHistory: getHistoryQuery.isError,
		isFetchingHistory: getHistoryQuery.isFetching,
		errorHistory: getHistoryQuery.error,

		fetchExportData,
		fetchHistoryExport,

		// Mutations
		mutations: {
			startSesi: {
				mutate: startSesiMutation.mutate,
				mutateAsync: startSesiMutation.mutateAsync,
				isPending: startSesiMutation.isPending,
				variables: startSesiMutation.variables,
			},
			verify: {
				mutate: updateStatusMutation.mutate,
				mutateAsync: updateStatusMutation.mutateAsync,
				isPending: updateStatusMutation.isPending,
			},
			update: {
				mutate: updateAbsensiMutation.mutate,
				mutateAsync: updateAbsensiMutation.mutateAsync,
				isPending: updateAbsensiMutation.isPending,
			},
			delete: {
				mutate: deleteMutation.mutate,
				mutateAsync: deleteMutation.mutateAsync,
				isPending: deleteMutation.isPending,
			},
		},

		// Utils untuk manual invalidation jika perlu
		refetch: getAllAbsensiGuruQuery.refetch,
		refetchHistory: getHistoryQuery.refetch,

		invalidate: invalidateData,
		invalidateHistory: () =>
			guruId && month
				? apiUtils.absenGuru.getHistoryByGuruId.invalidate({ guruId, month })
				: undefined,
	};
}
