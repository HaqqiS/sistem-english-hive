"use client";

import { toast } from "sonner";
import { api } from "@/trpc/react";

export function useJenisKelas() {
	const utils = api.useUtils();

	const {
		data: dataJenisKelas,
		isLoading: isLoadingJenisKelas,
		isError: isErrorJenisKelas,
		error: errorJenisKelas,
	} = api.jenisKelas.getJenisKelasList.useQuery();

	const createMutation = api.jenisKelas.createJenisKelas.useMutation({
		onSuccess: async () => {
			await utils.jenisKelas.invalidate();
			toast.success("Jenis kelas berhasil dibuat");
		},
		onError: (error) => {
			toast.error(`Gagal membuat jenis kelas: ${error.message}`);
		},
	});

	const updateMutation = api.jenisKelas.updateJenisKelas.useMutation({
		onSuccess: async () => {
			await utils.jenisKelas.invalidate();
			toast.success("Jenis kelas berhasil diperbarui");
		},
		onError: (error) => {
			toast.error(`Gagal memperbarui jenis kelas: ${error.message}`);
		},
	});

	const deleteMutation = api.jenisKelas.deleteJenisKelas.useMutation({
		onSuccess: async () => {
			await utils.jenisKelas.invalidate();
			toast.success("Jenis kelas berhasil dihapus");
		},
		onError: (error) => {
			toast.error(`Gagal menghapus jenis kelas: ${error.message}`);
		},
	});

	return {
		data: dataJenisKelas,
		isLoading: isLoadingJenisKelas,
		isError: isErrorJenisKelas,
		error: errorJenisKelas,

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
		},
	};
}
