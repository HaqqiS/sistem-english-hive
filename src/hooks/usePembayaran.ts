"use client";

import type { StatusPembayaran } from "@prisma/client";
import { keepPreviousData } from "@tanstack/react-query";
import type { PaginationState, SortingState } from "@tanstack/react-table";
import { toast } from "sonner";
import { api } from "@/trpc/react";
import type { TypePembayaranPaginated } from "@/types/pembayaran.type";

interface UsePembayaranOptions {
	// Query options
	enableGetAll?: boolean;
	enableGetJatuhTempo?: boolean;
	enableGetHistoryByMuridId?: boolean;

	initialDataPaginated?: TypePembayaranPaginated;

	// Pagination & Filter
	pagination?: PaginationState;
	sorting?: SortingState; // Add sorting type
	statusFilter?: StatusPembayaran | "ALL";
	muridIdFilter?: string;
	kelasIdFilter?: string;
	searchFilter?: string;
	filterCabang?: string;

	// Mutation callbacks
	onSuccessUpdate?: () => void;
	onSuccessDelete?: () => void;
	onSuccessCreateManual?: () => void;
}

/**
 * Custom hook to manage Pembayaran (Queries + Mutations)
 */
export function usePembayaran(options?: UsePembayaranOptions) {
	const apiUtils = api.useUtils();
	const cabangIdPayload =
		options?.filterCabang !== "ALL" ? options?.filterCabang : undefined;
	const kelasIdPayload =
		options?.kelasIdFilter !== "ALL" ? options?.kelasIdFilter : undefined;

	const pageIndex = options?.pagination?.pageIndex ?? 0;
	const pageSize = options?.pagination?.pageSize ?? 10;
	const sorting = options?.sorting; // Get sorting from options
	const shouldUseInitialData = pageIndex === 0 && pageSize === 50;

	const invalidatePayments = async () => {
		await Promise.all([
			apiUtils.pembayaran.getAllPaginated.invalidate(),
			apiUtils.pembayaran.getTagihanJatuhTempo.invalidate(),
			// TAMBAHAN: Invalidate list detail & saldo siswa
			apiUtils.pembayaran.getSaldoByMuridId.invalidate(),
		]);
	};

	// ========== QUERIES ==========

	// 1. Get All Pembayaran (with optional filters)

	const getAllPaginatedQuery = api.pembayaran.getAllPaginated.useQuery(
		{
			pageIndex,
			pageSize,
			status:
				options?.statusFilter && options.statusFilter !== "ALL"
					? options.statusFilter
					: undefined,
			muridId: options?.muridIdFilter,
			kelasId: kelasIdPayload,
			search: options?.searchFilter,
			cabangId: cabangIdPayload,
			sorting, // Pass sorting to query
		},
		{
			enabled: options?.enableGetAll ?? true,
			placeholderData: keepPreviousData,
			initialData: shouldUseInitialData
				? options?.initialDataPaginated
				: undefined,
		},
	);

	// 2. Get Tagihan Jatuh Tempo (Dashboard)
	const getJatuhTempoQuery = api.pembayaran.getTagihanJatuhTempo.useQuery(
		{ cabangId: cabangIdPayload },
		{
			enabled: options?.enableGetJatuhTempo ?? false, // Default false unless requested
			refetchOnWindowFocus: true,
		},
	);

	const fetchExportData = async () => {
		return await apiUtils.pembayaran.getForExport.fetch({
			// Reuse filter yang sudah ada di options hook ini!
			status:
				options?.statusFilter && options.statusFilter !== "ALL"
					? options.statusFilter
					: undefined,
			muridId: options?.muridIdFilter,
			search: options?.searchFilter,
			sorting,
		});
	};

	const getSaldoByMuridIdQuery = api.pembayaran.getSaldoByMuridId.useQuery;

	// ========== MUTATIONS ==========

	// 1. Update Status Pembayaran
	const updateMutation = api.pembayaran.updatePembayaran.useMutation({
		onSuccess: async () => {
			await invalidatePayments();
			toast.success("Data pembayaran berhasil diperbarui");
			options?.onSuccessUpdate?.();
		},
		onError: (error) => {
			toast.error(`Gagal update pembayaran: ${error.message}`);
		},
	});

	// 2. Delete Pembayaran
	const deleteMutation = api.pembayaran.deletePembayaran.useMutation({
		onSuccess: async () => {
			await invalidatePayments();
			toast.success("Data pembayaran berhasil dihapus");
			options?.onSuccessDelete?.();
		},
		onError: (error) => {
			toast.error(`Gagal menghapus: ${error.message}`);
		},
	});

	// 3. Create Manual Tagihan
	const createManualMutation = api.pembayaran.createManualTagihan.useMutation({
		onSuccess: async () => {
			await invalidatePayments();
			toast.success("Pembayaran manual berhasil dibuat");
			options?.onSuccessCreateManual?.();
		},
		onError: (error) => {
			toast.error(`Gagal membuat pembayaran: ${error.message}`);
		},
	});

	return {
		// Query Results
		dataGetAllPaginated: getAllPaginatedQuery.data?.data ?? [],
		pageCount: getAllPaginatedQuery.data?.pageCount ?? -1,
		totalRows: getAllPaginatedQuery.data?.total ?? 0,
		isLoadingGetAllPaginated: getAllPaginatedQuery.isLoading,
		isFetchingGetAllPaginated: getAllPaginatedQuery.isFetching,
		isErrorGetAllPaginated: getAllPaginatedQuery.isError,
		errorGetAllPaginated: getAllPaginatedQuery.error,
		refetchGetAllPaginated: getAllPaginatedQuery.refetch,

		dataJatuhTempo: getJatuhTempoQuery.data ?? [],
		isLoadingJatuhTempo: getJatuhTempoQuery.isLoading,
		isErrorJatuhTempo: getJatuhTempoQuery.isError,
		isRefetchingJatuhTempo: getJatuhTempoQuery.isFetching,
		errorJatuhTempo: getJatuhTempoQuery.error,
		refetchJatuhTempo: getJatuhTempoQuery.refetch,

		fetchExportData,

		getSaldoByMuridIdQuery,

		// Mutations
		mutations: {
			update: {
				mutate: updateMutation.mutate,
				mutateAsync: updateMutation.mutateAsync,
				isPending: updateMutation.isPending,
			},
			delete: {
				mutate: deleteMutation.mutate,
				mutateAsync: deleteMutation.mutateAsync,
				isPending: deleteMutation.isPending,
			},
			createManual: {
				mutate: createManualMutation.mutate,
				mutateAsync: createManualMutation.mutateAsync,
				isPending: createManualMutation.isPending,
			},
		},

		// Utils
		invalidateAll: () => apiUtils.pembayaran.invalidate(),
	};
}
