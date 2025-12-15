"use client";
import { skipToken } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/trpc/react";
import type { PendaftaranKelasType } from "@/types/pendaftaranKelas.type";

interface UseProgramKelasOptions {
	// Query options
	enableQuery?: boolean;
	initialData?: PendaftaranKelasType[];
	kelasId?: string;

	// Mutation callbacks
	onSuccessCreate?: () => void;
	onSuccessUpdate?: () => void;
	onSuccessDelete?: () => void;
}

/**
 */
export function usePendaftaranKelas(options?: UseProgramKelasOptions) {
	const apiUtils = api.useUtils();
	const kelasId = options?.kelasId;

	// ========== QUERIES ==========
	const daftarMuridByKelasIdQuery =
		api.pendaftaranKelas.getPendaftarByKelasId.useQuery(
			kelasId ? { kelasId } : skipToken,
			{
				enabled: options?.enableQuery && !!kelasId,
			},
		);

	const invalidatePendaftaran = async () => {
		await Promise.all([
			apiUtils.pendaftaranKelas.getPendaftarByKelasId.invalidate(),
			apiUtils.kelas.getKelasAndCount.invalidate(), // Update jumlah siswa di list kelas
			apiUtils.murid.getAllPaginated.invalidate(), // Update status murid
			apiUtils.murid.getMuridNotRegisteredPaginated.invalidate(),
			apiUtils.pembayaran.getAllPaginated.invalidate(), // Update tagihan baru
		]);
	};
	// ========== MUTATIONS ==========

	// CREATE
	const createMutation =
		api.pendaftaranKelas.createPendaftaranKelas.useMutation({
			onSuccess: async () => {
				await invalidatePendaftaran();
				toast.success("Pendaftaran Kelas berhasil ditambahkan");
				options?.onSuccessCreate?.();
			},
			onError: (error) => {
				toast.error(`Gagal membuat Program Kelas: ${error.message}`);
			},
		});

	const createBulkMutation =
		api.pendaftaranKelas.createBulkPendaftaranKelas.useMutation({
			onSuccess: async (data) => {
				await invalidatePendaftaran();
				toast.success(`Berhasil mendaftarkan ${data.count} murid ke kelas.`);
				options?.onSuccessCreate?.();
			},
			onError: (error) => {
				toast.error(`Gagal pendaftaran massal: ${error.message}`);
			},
		});

	// UPDATE
	const updateMutation =
		api.pendaftaranKelas.updatePendaftaranKelas.useMutation({
			onSuccess: async () => {
				await invalidatePendaftaran();
				toast.success("Pendaftaran Kelas berhasil diupdate");
				options?.onSuccessUpdate?.();
			},
			onError: (error) => {
				toast.error(`Gagal mengupdate Pendaftaran Kelas: ${error.message}`);
			},
		});

	// DELETE
	const deleteMutation =
		api.pendaftaranKelas.deletePendaftaranKelas.useMutation({
			onSuccess: async () => {
				await invalidatePendaftaran();
				toast.success("Murid berhasil dihapus dari Kelas");
				options?.onSuccessDelete?.();
			},
			onError: (error) => {
				toast.error(`Gagal menghapus Murid dari Kelas: ${error.message}`);
			},
		});

	return {
		// Query results

		dataByKelasId: daftarMuridByKelasIdQuery.data,
		isLoadingByKelasId: daftarMuridByKelasIdQuery.isLoading,
		isErrorByKelasId: daftarMuridByKelasIdQuery.isError,
		errorByKelasId: daftarMuridByKelasIdQuery.error,
		refetch: daftarMuridByKelasIdQuery.refetch,

		// Mutations
		mutations: {
			create: {
				mutate: createMutation.mutate,
				mutateAsync: createMutation.mutateAsync,
				isPending: createMutation.isPending,
			},
			createBulk: {
				mutate: createBulkMutation.mutate,
				mutateAsync: createBulkMutation.mutateAsync,
				isPending: createBulkMutation.isPending,
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
		invalidate: invalidatePendaftaran,
	};
}
