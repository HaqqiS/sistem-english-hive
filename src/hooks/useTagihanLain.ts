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
			utils.tagihanLain.getAllBukuPaginated.invalidate(),
			utils.tagihanLain.getAllRegistrasiPaginated.invalidate(),
			utils.tagihanLain.getAllLainnyaPaginated.invalidate(),
			utils.tagihanLain.getAllBelumLunas.invalidate(),
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

	// 2. Get All Buku Paginated
	const getAllBukuPaginatedQuery = api.tagihanLain.getAllBukuPaginated.useQuery(
		{
			pageIndex,
			pageSize,
			sorting,
			muridId: options.muridId,
			cabangId: cabangIdPayload,
			status: options.filterStatus,
			search: options.searchQuery,
		},
		{
			enabled:
				(options.enableGetAll ?? true) && options.filterKategori === "BUKU",
		},
	);

	// 4. Get All Registrasi Paginated
	const getAllRegistrasiPaginatedQuery =
		api.tagihanLain.getAllRegistrasiPaginated.useQuery(
			{
				pageIndex,
				pageSize,
				sorting,
				muridId: options.muridId,
				cabangId: cabangIdPayload,
				status: options.filterStatus,
				search: options.searchQuery,
			},
			{
				enabled:
					(options.enableGetAll ?? true) &&
					options.filterKategori === "REGISTRASI",
			},
		);

	// 5. Get All Lainnya Paginated
	const getAllLainnyaPaginatedQuery =
		api.tagihanLain.getAllLainnyaPaginated.useQuery(
			{
				pageIndex,
				pageSize,
				sorting,
				muridId: options.muridId,
				cabangId: cabangIdPayload,
				status: options.filterStatus,
				search: options.searchQuery,
			},
			{
				enabled:
					(options.enableGetAll ?? true) &&
					options.filterKategori === "LAINNYA",
			},
		);

	const getAllBelumLunasQuery = api.tagihanLain.getAllBelumLunas.useQuery({
		cabangId: cabangIdPayload,
		kategori: options.filterKategori,
	});

	// ========== MUTATIONS ==========

	const createMutation = api.tagihanLain.create.useMutation({
		onSuccess: async () => {
			await invalidateTagihan();
			toast.success("Tagihan berhasil dibuat");
			options.onSuccessCreate?.();
		},
		onError: (error) => {
			toast.error(`Gagal membuat tagihan: ${error.message}`);
		},
	});

	const updateMutation = api.tagihanLain.update.useMutation({
		onSuccess: async () => {
			await invalidateTagihan();
			toast.success("Tagihan berhasil diperbarui");
			options.onSuccessUpdate?.();
		},
		onError: (error) => {
			toast.error(`Gagal memperbarui tagihan: ${error.message}`);
		},
	});

	const deleteMutation = api.tagihanLain.delete.useMutation({
		onSuccess: async () => {
			await invalidateTagihan();
			toast.success("Tagihan berhasil dihapus");
			options.onSuccessDelete?.();
		},
		onError: (error) => {
			toast.error(`Gagal menghapus tagihan: ${error.message}`);
		},
	});

	const markAsPaidMutation = api.tagihanLain.markAsPaid.useMutation({
		onSuccess: async () => {
			await invalidateTagihan();
			toast.success("Tagihan ditandai lunas");
			options.onSuccessMarkPaid?.();
		},
		onError: (error) => {
			toast.error(`Gagal update status: ${error.message}`);
		},
	});

	return {
		// Query Results - standardized names matches usePembayaran
		dataGetAllBukuPaginated: getAllBukuPaginatedQuery.data?.data ?? [],
		pageCountBuku: getAllBukuPaginatedQuery.data?.pageCount ?? -1,
		totalRowsBuku: getAllBukuPaginatedQuery.data?.total ?? 0,
		isLoadingGetAllBukuPaginated: getAllBukuPaginatedQuery.isLoading,
		isFetchingGetAllBukuPaginated: getAllBukuPaginatedQuery.isFetching,
		refetchGetAllBukuPaginated: getAllBukuPaginatedQuery.refetch,

		dataGetAllRegistrasiPaginated:
			getAllRegistrasiPaginatedQuery.data?.data ?? [],
		pageCountRegistrasi: getAllRegistrasiPaginatedQuery.data?.pageCount ?? -1,
		totalRowsRegistrasi: getAllRegistrasiPaginatedQuery.data?.total ?? 0,
		isLoadingGetAllRegistrasiPaginated:
			getAllRegistrasiPaginatedQuery.isLoading,
		isFetchingGetAllRegistrasiPaginated:
			getAllRegistrasiPaginatedQuery.isFetching,
		refetchGetAllRegistrasiPaginated: getAllRegistrasiPaginatedQuery.refetch,

		dataGetAllLainnyaPaginated: getAllLainnyaPaginatedQuery.data?.data ?? [],
		pageCountLainnya: getAllLainnyaPaginatedQuery.data?.pageCount ?? -1,
		totalRowsLainnya: getAllLainnyaPaginatedQuery.data?.total ?? 0,
		isLoadingGetAllLainnyaPaginated: getAllLainnyaPaginatedQuery.isLoading,
		isFetchingGetAllLainnyaPaginated: getAllLainnyaPaginatedQuery.isFetching,
		refetchGetAllLainnyaPaginated: getAllLainnyaPaginatedQuery.refetch,

		// Specific Query
		dataByMurid: getAllByMuridQuery.data,
		isLoadingByMurid: getAllByMuridQuery.isLoading,
		isErrorByMurid: getAllByMuridQuery.isError,

		dataGetAllBelumLunas: getAllBelumLunasQuery.data,
		isLoadingGetAllBelumLunas: getAllBelumLunasQuery.isLoading,
		isFetchingGetAllBelumLunas: getAllBelumLunasQuery.isFetching,
		refetchGetAllBelumLunas: getAllBelumLunasQuery.refetch,

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
		fetchExportData: async (kategori: KategoriTagihan) => {
			return utils.tagihanLain.getForExport.fetch({
				kategori,
				status: options.filterStatus,
				muridId: options.muridId,
				search: options.searchQuery,
				cabangId: cabangIdPayload,
			});
		},
	};
};
