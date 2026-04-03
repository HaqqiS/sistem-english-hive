"use client";
import type { TipeKelas } from "@prisma/client";
import { skipToken } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/trpc/react";
import type {
	TypeCreateKelas,
	TypeKelas,
	TypeKelasByGuruId,
	TypeKelasHistory,
	TypeKelasWithSesiPertemuanCount,
} from "@/types/kelas.type";

interface UseKelasOptions {
	// Query options
	enableQueryGetKelasAktif?: boolean;
	enableQueryGetKelasCount?: boolean;
	enableQueryGetKelasWaitingCount?: boolean;
	enableQueryGetKelasTrialCount?: boolean;
	enableQueryGetKelasLevelUp?: boolean;
	enableQueryGetKelasCompleted?: boolean;
	enableQueryGetKelasId?: boolean;
	enableQueryGetKelasSiapOrderBuku?: boolean;
	enableQueryGetKelasWithSesi?: boolean;

	initialDataKelasAktif?: TypeKelas[];
	initialDataKelasCount?: TypeKelasWithSesiPertemuanCount[];
	initialDataKelasWithSesi?: TypeKelasByGuruId[];
	initialDataHistory?: TypeKelasHistory[];

	// Mutation callbacks
	onSuccessCreate?: (newKelas: TypeCreateKelas) => void;
	onSuccessUpdate?: () => void;
	onSuccessDelete?: () => void;
	onSuccessUpLevel?: () => void;

	// ID untuk query by ID
	kelasId?: string;
	cohortId?: string;
	filterCabang?: string;
	tipeKelas?: TipeKelas | "ALL";
	jenisKelas?: string | "ALL";
	levelKelas?: number | "ALL";
	guruId?: string | "ALL";
}

export function useKelas(options?: UseKelasOptions) {
	const apiUtils = api.useUtils();

	const kelasId = options?.kelasId;
	const cohortId = options?.cohortId;
	const cabangIdPayload =
		options?.filterCabang !== "ALL" ? options?.filterCabang : undefined;
	const tipeKelasPayload =
		options?.tipeKelas !== "ALL" ? options?.tipeKelas : undefined;
	const jenisKelasPayload =
		options?.jenisKelas !== "ALL" ? options?.jenisKelas : undefined;
	const levelKelasPayload =
		options?.levelKelas !== "ALL" ? options?.levelKelas : undefined;
	const guruIdPayload = options?.guruId !== "ALL" ? options?.guruId : undefined;
	// ========== QUERIES ==========

	const kelasAktifQuery = api.kelas.getKelasAktif.useQuery(
		{ cabangId: cabangIdPayload },
		{
			enabled: options?.enableQueryGetKelasAktif ?? false,
			initialData: options?.initialDataKelasAktif,
		},
	);

	const kelasCountQuery = api.kelas.getKelasAndCount.useQuery(
		{
			cabangId: cabangIdPayload,
			tipeKelas: tipeKelasPayload,
			jenisKelas: jenisKelasPayload,
			levelKelas: levelKelasPayload,
			guruId: guruIdPayload,
		},
		{
			enabled: options?.enableQueryGetKelasCount ?? false,
			initialData: options?.initialDataKelasCount,
			refetchOnWindowFocus: false,
		},
	);

	const kelasWaitingCountQuery = api.kelas.getKelasWaitingAndCount.useQuery(
		{
			cabangId: cabangIdPayload,
			tipeKelas: tipeKelasPayload,
			jenisKelas: jenisKelasPayload,
			levelKelas: levelKelasPayload,
			guruId: guruIdPayload,
		},
		{
			enabled: options?.enableQueryGetKelasWaitingCount ?? false,
			initialData: options?.initialDataKelasCount,
			refetchOnWindowFocus: false,
		},
	);

	const kelasTrialCountQuery = api.kelas.getKelasTrialAndCount.useQuery(
		{
			cabangId: cabangIdPayload,
			tipeKelas: tipeKelasPayload,
			jenisKelas: jenisKelasPayload,
			levelKelas: levelKelasPayload,
			guruId: guruIdPayload,
		},
		{
			enabled: options?.enableQueryGetKelasTrialCount ?? false,
			initialData: options?.initialDataKelasCount,
			refetchOnWindowFocus: false,
		},
	);

	const kelasByIdQuery = api.kelas.getKelasById.useQuery(
		kelasId ? { id: kelasId } : skipToken,
	);

	const kelasWithSesiQuery = api.kelas.getKelasWithSesiForGuru.useQuery(
		{ cabangId: cabangIdPayload },
		{
			enabled: options?.enableQueryGetKelasWithSesi ?? false,
			initialData: options?.initialDataKelasWithSesi,
		},
	);

	const kelasHistoryQuery = api.kelas.getKelasHistory.useQuery(
		cohortId ? { cohortId: cohortId } : skipToken,
		{
			enabled: !!cohortId,
			initialData: options?.initialDataHistory,
		},
	);

	const kelasLevelUpQuery = api.kelas.getKelasLevelUp.useQuery(
		{
			cabangId: cabangIdPayload,
			tipeKelas: tipeKelasPayload,
			jenisKelas: jenisKelasPayload,
			levelKelas: levelKelasPayload,
			guruId: guruIdPayload,
		},
		{
			enabled: options?.enableQueryGetKelasLevelUp ?? false,
			refetchOnWindowFocus: false,
		},
	);

	const kelasCompletedQuery = api.kelas.getKelasCompleted.useQuery(
		{
			cabangId: cabangIdPayload,
			tipeKelas: tipeKelasPayload,
			jenisKelas: jenisKelasPayload,
			levelKelas: levelKelasPayload,
			guruId: guruIdPayload,
		},
		{
			enabled: options?.enableQueryGetKelasCompleted ?? false,
			refetchOnWindowFocus: false,
		},
	);

	const kelasSiapOrderBukuQuery = api.kelas.getKelasSiapOrderBuku.useQuery(
		{ cabangId: cabangIdPayload },
		{
			enabled: options?.enableQueryGetKelasSiapOrderBuku ?? false,
			refetchOnWindowFocus: false,
		}
	);

	const fetchExportData = async () => {
		return await apiUtils.kelas.getForExport.fetch({
			cabangId: cabangIdPayload,
		});
	};

	const invalidateAll = async () => {
		await Promise.all([
			apiUtils.kelas.getKelasAktif.invalidate(),
			apiUtils.kelas.getKelasAndCount.invalidate(),
			apiUtils.kelas.getKelasWaitingAndCount.invalidate(),
			apiUtils.kelas.getKelasTrialAndCount.invalidate(),
			apiUtils.kelas.getKelasLevelUp.invalidate(),
			apiUtils.kelas.getKelasCompleted.invalidate(),
			apiUtils.kelas.getKelasById.invalidate(),
			apiUtils.kelas.getKelasSiapOrderBuku.invalidate(),
		]);
	};
	// ========== MUTATIONS ==========

	// CREATE
	const createMutation = api.kelas.createKelas.useMutation({
		onSuccess: async (newKelas) => {
			await invalidateAll();
			toast.success("Kelas berhasil ditambahkan");
			options?.onSuccessCreate?.(newKelas);
		},
		onError: (error) => {
			toast.error(`Gagal membuat Kelas: ${error.message}`);
		},
	});

	// UPDATE
	const updateMutation = api.kelas.updateKelas.useMutation({
		onSuccess: async () => {
			await invalidateAll();
			toast.success("Kelas berhasil diupdate");
			options?.onSuccessUpdate?.();
		},
		onError: (error) => {
			toast.error(`Gagal mengupdate kelas: ${error.message}`);
		},
	});

	// DELETE
	const deleteMutation = api.kelas.deleteKelas.useMutation({
		onSuccess: async () => {
			await invalidateAll();
			toast.success("Kelas berhasil dihapus");
			options?.onSuccessDelete?.();
		},
		onError: (error) => {
			toast.error(`Gagal menghapus kelas: ${error.message}`);
		},
	});

	// UP LEVEL KELAS
	const upLevelMutation = api.kelas.upLevelKelas.useMutation({
		onSuccess: async () => {
			// Invalidate relevant queries
			await invalidateAll();
			await apiUtils.pembayaran.getAllPaginated.invalidate();
			await apiUtils.pembayaran.getTagihanJatuhTempo.invalidate();

			toast.success("Kelas berhasil di-uplevel");
			options?.onSuccessUpLevel?.();
		},
		onError: (error) => {
			toast.error(`Gagal menguplevel Kelas: ${error.message}`);
		},
	});

	// TOGGLE ORDER BUKU
	const toggleOrderBukuMutation = api.kelas.toggleOrderBuku.useMutation({
		onSuccess: async () => {
			await apiUtils.kelas.getKelasSiapOrderBuku.invalidate();
			toast.success("Status order buku berhasil diperbarui");
		},
		onError: (error) => {
			toast.error(`Gagal mengupdate status: ${error.message}`);
		}
	});

	return {
		dataKelasAktif: kelasAktifQuery.data,
		isLoadingKelasAktif: kelasAktifQuery.isLoading,
		isErrorKelasAktif: kelasAktifQuery.isError,
		errorKelasAktif: kelasAktifQuery.error,

		dataKelasCount: kelasCountQuery.data,
		isLoadingKelasCount: kelasCountQuery.isLoading,
		isErrorKelasCount: kelasCountQuery.isError,
		isRefetchingKelasCount: kelasCountQuery.isFetching,
		errorKelasCount: kelasCountQuery.error,

		dataById: kelasByIdQuery.data,
		isLoadingById: kelasByIdQuery.isLoading,
		isErrorById: kelasByIdQuery.isError,
		errorById: kelasByIdQuery.error,

		dataWithSesi: kelasWithSesiQuery.data,
		isLoadingWithSesi: kelasWithSesiQuery.isLoading,
		isErrorWithSesi: kelasWithSesiQuery.isError,
		errorWithSesi: kelasWithSesiQuery.error,

		dataHistory: kelasHistoryQuery.data,
		isLoadingHistory: kelasHistoryQuery.isLoading,
		isErrorHistory: kelasHistoryQuery.isError,
		errorHistory: kelasHistoryQuery.error,

		fetchExportData,

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
				mutate: deleteMutation.mutate,
				mutateAsync: deleteMutation.mutateAsync,
				isPending: deleteMutation.isPending,
			},
			upLevel: {
				mutate: upLevelMutation.mutate,
				mutateAsync: upLevelMutation.mutateAsync,
				isPending: upLevelMutation.isPending,
			},
			toggleOrderBuku: {
				mutate: toggleOrderBukuMutation.mutate,
				mutateAsync: toggleOrderBukuMutation.mutateAsync,
				isPending: toggleOrderBukuMutation.isPending,
			}
		},

		// Utils untuk manual invalidation jika perlu
		dataKelasWaiting: kelasWaitingCountQuery.data,
		isLoadingKelasWaiting: kelasWaitingCountQuery.isLoading,
		isErrorKelasWaiting: kelasWaitingCountQuery.isError,
		errorKelasWaiting: kelasWaitingCountQuery.error,

		dataKelasTrial: kelasTrialCountQuery.data,
		isLoadingKelasTrial: kelasTrialCountQuery.isLoading,
		isErrorKelasTrial: kelasTrialCountQuery.isError,
		errorKelasTrial: kelasTrialCountQuery.error,

		dataKelasLevelUp: kelasLevelUpQuery.data,
		isLoadingKelasLevelUp: kelasLevelUpQuery.isLoading,
		isErrorKelasLevelUp: kelasLevelUpQuery.isError,
		errorKelasLevelUp: kelasLevelUpQuery.error,
		refetchKelasLevelUp: kelasLevelUpQuery.refetch,

		dataKelasCompleted: kelasCompletedQuery.data,
		isLoadingKelasCompleted: kelasCompletedQuery.isLoading,
		isErrorKelasCompleted: kelasCompletedQuery.isError,
		errorKelasCompleted: kelasCompletedQuery.error,
		refetchKelasCompleted: kelasCompletedQuery.refetch,

		refetchKelasWaiting: kelasWaitingCountQuery.refetch,
		refetchKelasTrial: kelasTrialCountQuery.refetch,

		refetchKelasAktif: kelasAktifQuery.refetch,
		refetchKelasCount: kelasCountQuery.refetch,
		refetchById: kelasByIdQuery.refetch,
		refetchHistory: kelasHistoryQuery.refetch,
		invalidate: invalidateAll,
		
		dataKelasOrderBuku: kelasSiapOrderBukuQuery.data,
		isLoadingKelasOrderBuku: kelasSiapOrderBukuQuery.isLoading,
		isErrorKelasOrderBuku: kelasSiapOrderBukuQuery.isError,
		errorKelasOrderBuku: kelasSiapOrderBukuQuery.error,
		refetchKelasOrderBuku: kelasSiapOrderBukuQuery.refetch,
	};
}
