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
	enableQueryGetKelasId?: boolean;
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
		},
		{
			enabled: options?.enableQueryGetKelasCount ?? false,
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

	const fetchExportData = async () => {
		return await apiUtils.kelas.getForExport.fetch({
			cabangId: cabangIdPayload,
		});
	};

	const invalidateAll = async () => {
		await Promise.all([
			apiUtils.kelas.getKelasAktif.invalidate(),
			apiUtils.kelas.getKelasAndCount.invalidate(),
			apiUtils.kelas.getKelasById.invalidate(),
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
		},

		// Utils untuk manual invalidation jika perlu
		refetchKelasAktif: kelasAktifQuery.refetch,
		refetchKelasCount: kelasCountQuery.refetch,
		refetchById: kelasByIdQuery.refetch,
		refetchHistory: kelasHistoryQuery.refetch,
		invalidate: invalidateAll,
	};
}
