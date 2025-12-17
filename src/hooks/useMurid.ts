"use client";

import type { StatusMurid } from "@prisma/client";
import { keepPreviousData } from "@tanstack/react-query";
import type { PaginationState } from "@tanstack/react-table";
import { toast } from "sonner";
import { api } from "@/trpc/react";
import type {
	TypeAllMuridPaginated,
	TypeMuridNotRegisteredPaginated,
} from "@/types/murid.type";

interface useMuridOptions {
	// Query options
	enableQuery?: boolean;
	enableNotRegisteredQuery?: boolean;
	enableDuplicateNoWAQuery?: boolean;

	initialDataNotRegisteredPaginated?: TypeMuridNotRegisteredPaginated;
	initialDataAllPaginated?: TypeAllMuridPaginated;

	pagination?: PaginationState;

	filterCabang?: string;

	// Filters for "All Murid"
	searchFilterAll?: string;
	filterStatusAll?: StatusMurid | "ALL";
	tipeProgramAll?: "REGULER" | "PRIVAT" | "ALL";
	filterNoWAAll?: string | "ALL";

	// Filters for "Not Registered"
	searchFilterNotRegistered?: string;
	filterStatusNotRegistered?: StatusMurid | "ALL";
	tipeProgramNotRegistered?: "REGULER" | "PRIVAT" | "ALL";
	filterNoWANotRegistered?: string | "ALL";

	// Mutation callbacks
	onSuccessCreate?: () => void;
	onSuccessUpdate?: () => void;
	onSuccessDelete?: () => void;
}

/**
 */
export function useMurid(options?: useMuridOptions) {
	const apiUtils = api.useUtils();
	const pageIndex = options?.pagination?.pageIndex ?? 0;
	const pageSize = options?.pagination?.pageSize ?? 10;
	const shouldUseInitialData = pageIndex === 0 && pageSize === 10;

	const cabangIdPayload =
		options?.filterCabang !== "ALL" ? options?.filterCabang : undefined;

	// ========== QUERIES ==========
	const MuridNotRegisteredQuery = api.murid.getMuridWhereNotRegistered.useQuery(
		{ cabangId: cabangIdPayload },
		{
			enabled: options?.enableNotRegisteredQuery ?? false,
			// initialData: options?.initialDataNotRegistered,
		},
	);

	const MuridNotRegisteredPaginatedQuery =
		api.murid.getMuridNotRegisteredPaginated.useQuery(
			{
				pageIndex,
				pageSize,
				cabangId: cabangIdPayload,
				search: options?.searchFilterNotRegistered,
				status:
					options?.filterStatusNotRegistered !== "ALL"
						? options?.filterStatusNotRegistered
						: undefined,
				tipeProgram:
					options?.tipeProgramNotRegistered !== "ALL"
						? options?.tipeProgramNotRegistered
						: undefined,
				filterNoWA:
					options?.filterNoWANotRegistered !== "ALL"
						? options?.filterNoWANotRegistered
						: undefined,
			},
			{
				enabled: !!options?.pagination,
				placeholderData: keepPreviousData,
				initialData: shouldUseInitialData
					? options?.initialDataNotRegisteredPaginated
					: undefined,
			},
		);

	const DuplicateNoWAQuery = api.murid.getDuplicateNoWA.useQuery(
		{ cabangId: cabangIdPayload },
		{
			enabled: options?.enableDuplicateNoWAQuery ?? false,
		},
	);

	const MuridPaginatedQuery = api.murid.getAllPaginated.useQuery(
		{
			pageIndex,
			pageSize,
			search: options?.searchFilterAll,
			status:
				options?.filterStatusAll !== "ALL"
					? options?.filterStatusAll
					: undefined,
			tipeProgram:
				options?.tipeProgramAll !== "ALL" ? options?.tipeProgramAll : undefined,
			cabangId: cabangIdPayload,
			filterNoWA:
				options?.filterNoWAAll !== "ALL" ? options?.filterNoWAAll : undefined,
		},
		{
			enabled: !!options?.pagination,
			placeholderData: keepPreviousData,
			initialData: shouldUseInitialData
				? options?.initialDataAllPaginated
				: undefined,
		},
	);

	const fetchExportData = async () => {
		return await apiUtils.murid.getForExport.fetch({
			search: options?.searchFilterAll,
			status:
				options?.filterStatusAll !== "ALL"
					? options?.filterStatusAll
					: undefined,
			cabangId: cabangIdPayload,
		});
	};

	const invalidateMuridData = async () => {
		await Promise.all([
			apiUtils.murid.getMuridNotRegisteredPaginated.invalidate(),
			apiUtils.murid.getAllPaginated.invalidate(),
		]);
	};

	// ========== MUTATIONS ==========

	// CREATE
	const createMutation = api.murid.registerMurid.useMutation({
		onSuccess: async () => {
			await invalidateMuridData();
			toast.success("Murid berhasil didaftarkan");
			options?.onSuccessCreate?.();
		},
		onError: (error) => {
			toast.error(`Gagal mendaftar Murid: ${error.message}`);
		},
	});

	// UPDATE

	const updateStatusMuridMutation = api.murid.updateStatusMurid.useMutation({
		onSuccess: async () => {
			await invalidateMuridData();
			toast.success("Status Murid berhasil diupdate");
			options?.onSuccessUpdate?.();
		},
		onError: (error) => {
			toast.error(`Gagal mengupdate Status Murid: ${error.message}`);
		},
	});
	const updateMutation = api.murid.updateMurid.useMutation({
		onSuccess: async () => {
			await invalidateMuridData();
			toast.success("Murid berhasil diupdate");
			options?.onSuccessUpdate?.();
		},
		onError: (error) => {
			toast.error(`Gagal mengupdate Murid: ${error.message}`);
		},
	});

	// DELETE
	const deleteMutation = api.murid.deleteMurid.useMutation({
		onSuccess: async () => {
			await invalidateMuridData();
			toast.success("Murid berhasil dihapus");
			options?.onSuccessDelete?.();
		},
		onError: (error) => {
			toast.error(`Gagal menghapus Murid: ${error.message}`);
		},
	});

	return {
		// Query results
		dataMuridNotRegistered: MuridNotRegisteredQuery.data,
		isLoadingMuridNotRegistered: MuridNotRegisteredQuery.isLoading,
		isErrorMuridNotRegistered: MuridNotRegisteredQuery.isError,
		errorMuridNotRegistered: MuridNotRegisteredQuery.error,

		dataNotRegisteredPaginated:
			MuridNotRegisteredPaginatedQuery.data?.data ?? [],
		pageCountNotRegistered:
			MuridNotRegisteredPaginatedQuery.data?.pageCount ?? -1,
		totalRowsNotRegistered: MuridNotRegisteredPaginatedQuery.data?.total ?? 0,
		isLoadingNotRegisteredPaginated: MuridNotRegisteredPaginatedQuery.isLoading,
		isFetchingNotRegisteredPaginated:
			MuridNotRegisteredPaginatedQuery.isFetching,
		isErrorNotRegisteredPaginated: MuridNotRegisteredPaginatedQuery.isError,
		errorNotRegisteredPaginated: MuridNotRegisteredPaginatedQuery.error,

		dataAllMuridPaginated: MuridPaginatedQuery.data?.data ?? [],
		pageCount: MuridPaginatedQuery.data?.pageCount ?? -1,
		totalRows: MuridPaginatedQuery.data?.total ?? 0,
		isLoadingAllMuridPaginated: MuridPaginatedQuery.isLoading,
		isFetchingAllMuridPaginated: MuridPaginatedQuery.isFetching,
		isErrorAllMuridPaginated: MuridPaginatedQuery.isError,
		errorAllMuridPaginated: MuridPaginatedQuery.error,

		fetchExportData,

		// Mutations
		mutations: {
			create: {
				mutate: createMutation.mutate,
				mutateAsync: createMutation.mutateAsync,
				isPending: createMutation.isPending,
			},
			updateStatus: {
				mutate: updateStatusMuridMutation.mutate,
				mutateAsync: updateStatusMuridMutation.mutateAsync,
				isPending: updateStatusMuridMutation.isPending,
			},
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
		},

		// Utils untuk manual invalidation jika perlu
		refetchPaginated: MuridPaginatedQuery.refetch,
		refetchNotRegisteredPaginated: MuridNotRegisteredPaginatedQuery.refetch,
		// invalidate: () => apiUtils.murid.getMuridWhereNotRegistered.invalidate(),

		dataDuplicateNoWA: DuplicateNoWAQuery.data ?? [],
		isLoadingDuplicateNoWA: DuplicateNoWAQuery.isLoading,
	};
}
