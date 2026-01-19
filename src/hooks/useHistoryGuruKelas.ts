"use client";
import { skipToken } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/trpc/react";
import type { TypeHistoryGuruKelasByKelasId } from "@/types/historyGuruKelas.type";

interface useHistoryGuruKelasOptions {
	// Query options
	enableQuery?: boolean;
	initialData?: TypeHistoryGuruKelasByKelasId[];

	// Mutation callbacks
	onSuccessCreate?: () => void;
	onSuccessUpdate?: () => void;
	onSuccessDelete?: () => void;

	// ID untuk query by ID
	kelasId?: string;
	filterCabang?: string;
}

export function UseHistoryGuruKelas(options?: useHistoryGuruKelasOptions) {
	const apiUtils = api.useUtils();

	const kelasId = options?.kelasId;
	// ========== QUERIES ==========

	const historyGuruKelasQuery =
		api.historyGuruKelas.getHistoryGuruByKelasId.useQuery(
			kelasId ? { kelasId: kelasId } : skipToken,
		);
	// ========== MUTATIONS ==========

	// CREATE
	const createMutation =
		api.historyGuruKelas.createHistoryGuruKelas.useMutation({
			onSuccess: async (_data, variables) => {
				await apiUtils.historyGuruKelas.getHistoryGuruByKelasId.invalidate({
					kelasId: variables.kelasId,
				});
				toast.success("History Guru Kelas berhasil ditambahkan");
				options?.onSuccessCreate?.();
			},
			onError: (error) => {
				toast.error(`Gagal membuat History Guru Kelas: ${error.message}`);
			},
		});

	// UPDATE
	const updateMutation =
		api.historyGuruKelas.updateHistoryGuruKelas.useMutation({
			onSuccess: async (_data, variables) => {
				await apiUtils.historyGuruKelas.getHistoryGuruByKelasId.invalidate({
					kelasId: variables.kelasId,
				});
				await apiUtils.kelas.getKelasAndCount.invalidate();
				toast.success("History Guru Kelas berhasil diupdate");
				options?.onSuccessUpdate?.();
			},
			onError: (error) => {
				toast.error(`Gagal mengupdate History Guru Kelas: ${error.message}`);
			},
		});

	// DELETE
	const deleteMutation =
		api.historyGuruKelas.deleteHistoryGuruKelas.useMutation({
			onSuccess: async (_data, variables) => {
				await apiUtils.historyGuruKelas.getHistoryGuruByKelasId.invalidate({
					kelasId: variables.kelasId,
				});
				toast.success("History Guru Kelas berhasil dihapus");
				options?.onSuccessDelete?.();
			},
			onError: (error) => {
				toast.error(`Gagal menghapus History Guru Kelas: ${error.message}`);
			},
		});

	// TOGGLE STATUS
	const toggleStatusMutation =
		api.historyGuruKelas.toggleStatusHistoryGuruKelas.useMutation({
			onSuccess: async (data) => {
				// Invalidate data history guru untuk kelas ini
				const targetKelasId = data.kelasId; // data result dari mutation update return object historyGuruKelas

				await apiUtils.historyGuruKelas.getHistoryGuruByKelasId.invalidate({
					kelasId: targetKelasId,
				});

				// Jika opsi global kelasId berbeda/tidak ada, kita tetap aman karena invalidasi menggunakan ID spesifik
				// Tapi jika kita juga mau invalidate queries lain yang mungkin terkait (misal detail kelas count), bisa ditambahkan:
				await apiUtils.kelas.getKelasAndCount.invalidate();

				toast.success("Status guru berhasil diperbarui");
				options?.onSuccessUpdate?.();
			},
			onError: (error) => {
				toast.error(`Gagal memperbarui status guru: ${error.message}`);
			},
		});

	return {
		dataById: historyGuruKelasQuery.data,
		isLoadingById: historyGuruKelasQuery.isLoading,
		isErrorById: historyGuruKelasQuery.isError,
		errorById: historyGuruKelasQuery.error,

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
			toggleStatus: {
				mutate: toggleStatusMutation.mutate,
				mutateAsync: toggleStatusMutation.mutateAsync,
				isPending: toggleStatusMutation.isPending,
			},
		},

		// Utils untuk manual invalidation jika perlu
		refetchById: historyGuruKelasQuery.refetch,
		invalidate: () =>
			apiUtils.historyGuruKelas.getHistoryGuruByKelasId.invalidate(),
	};
}
