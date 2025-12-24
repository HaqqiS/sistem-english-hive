import type { KategoriTagihan, StatusPembayaran } from "@prisma/client";
import type { PaginationState, SortingState } from "@tanstack/react-table";
import { toast } from "sonner";
import { api } from "@/trpc/react";

interface UseTagihanLainOptions {
	// Query options
	enableGetAll?: boolean;
	muridId?: string;

	// Pagination & Filter
	pagination?: PaginationState;
	sorting?: SortingState;
	filterCabang?: string;
	filterStatus?: StatusPembayaran;
	filterKategori?: KategoriTagihan;
	searchQuery?: string;

	// Mutation callbacks
	onSuccessCreate?: () => void;
	onSuccessUpdate?: () => void;
	onSuccessDelete?: () => void;
	onSuccessMarkPaid?: () => void;
}

export const useTagihanLain = (options: UseTagihanLainOptions = {}) => {
	const utils = api.useUtils();

	const pageIndex = options.pagination?.pageIndex ?? 0;
	const pageSize = options.pagination?.pageSize ?? 10;
	const sorting = options.sorting ?? [];

	const cabangIdPayload =
		options?.filterCabang !== "ALL" ? options?.filterCabang : undefined;

	const invalidateTagihan = async () => {
		await Promise.all([
			utils.tagihanLain.getAllByMurid.invalidate(),
			utils.tagihanLain.getAllPaginated.invalidate(),
		]);
	};

	// ========== QUERIES ==========

	// 1. Get All by Murid (Simple List - usually for dropdowns or simple views)
	const getAllByMuridQuery = api.tagihanLain.getAllByMurid.useQuery(
		{ muridId: options.muridId ?? "" },
		{
			enabled: !!options.muridId && !options.enableGetAll,
		},
	);

	// 2. Get All Paginated (Global List or Student List Paginated)
	const getAllPaginatedQuery = api.tagihanLain.getAllPaginated.useQuery(
		{
			pageIndex,
			pageSize,
			sorting,
			muridId: options.muridId,
			cabangId: cabangIdPayload,
			status: options.filterStatus,
			kategori: options.filterKategori,
			search: options.searchQuery,
		},
		{ enabled: options.enableGetAll ?? true },
	);

	// ========== MUTATIONS ==========

	const createMutation = api.tagihanLain.create.useMutation({
		onSuccess: async () => {
			await invalidateTagihan();
			toast.success("Tagihan berhasil dibuat");
			options.onSuccessCreate?.();
		},
		onError: (err) => toast.error(`Gagal membuat tagihan: ${err.message}`),
	});

	const updateMutation = api.tagihanLain.update.useMutation({
		onSuccess: async () => {
			await invalidateTagihan();
			toast.success("Tagihan berhasil diperbarui");
			options.onSuccessUpdate?.();
		},
		onError: (err) => toast.error(`Gagal memperbarui tagihan: ${err.message}`),
	});

	const deleteMutation = api.tagihanLain.delete.useMutation({
		onSuccess: async () => {
			await invalidateTagihan();
			toast.success("Tagihan berhasil dihapus");
			options.onSuccessDelete?.();
		},
		onError: (err) => toast.error(`Gagal menghapus tagihan: ${err.message}`),
	});

	const markAsPaidMutation = api.tagihanLain.markAsPaid.useMutation({
		onSuccess: async () => {
			await invalidateTagihan();
			toast.success("Tagihan ditandai lunas");
			options.onSuccessMarkPaid?.();
		},
		onError: (err) => toast.error(`Gagal update status: ${err.message}`),
	});

	return {
		// Query Results - standardized names matches usePembayaran
		dataGetAllPaginated: getAllPaginatedQuery.data?.data ?? [],
		pageCount: getAllPaginatedQuery.data?.pageCount ?? -1,
		totalRows: getAllPaginatedQuery.data?.total ?? 0,
		isLoadingGetAllPaginated: getAllPaginatedQuery.isLoading,
		isFetchingGetAllPaginated: getAllPaginatedQuery.isFetching,
		isErrorGetAllPaginated: getAllPaginatedQuery.isError,
		errorGetAllPaginated: getAllPaginatedQuery.error,
		refetchGetAllPaginated: getAllPaginatedQuery.refetch,

		// Specific Query
		dataByMurid: getAllByMuridQuery.data,
		isLoadingByMurid: getAllByMuridQuery.isLoading,
		isErrorByMurid: getAllByMuridQuery.isError,

		// Mutations Grouped
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
				mutate: deleteMutation.mutate,
				mutateAsync: deleteMutation.mutateAsync,
				isPending: deleteMutation.isPending,
			},
			markAsPaid: {
				mutate: markAsPaidMutation.mutate,
				mutateAsync: markAsPaidMutation.mutateAsync,
				isPending: markAsPaidMutation.isPending,
			},
		},

		// Utils
		invalidateAll: invalidateTagihan,
	};
};
