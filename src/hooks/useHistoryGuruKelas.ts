"use client";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import type { TypeHistoryGuruKelasByKelasId } from "@/types/historyGuruKelas.type";
import { skipToken } from "@tanstack/react-query";

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
}

/**
 * Custom hook untuk mengelola Cabang (Queries + Mutations)
 *
 * @example
 * // Hanya butuh data cabang
 * const { data: cabangList } = useCabang();
 *
 * // Butuh data + mutations
 * const { data, mutations } = useCabang({
 *   onSuccessCreate: () => console.log("Created!")
 * });
 */
export function UseHistoryGuruKelas(options?: useHistoryGuruKelasOptions) {
  const apiUtils = api.useUtils();

  // ========== QUERIES ==========
  const kelasId = options?.kelasId;
  // const isGetAllEnabled = (options?.enableQuery ?? true) && !kelasId;

  const historyGuruKelasQuery =
    api.historyGuruKelas.getHistoryGuruByKelasId.useQuery(
      kelasId ? { kelasId: kelasId } : skipToken,
    );
  // ========== MUTATIONS ==========

  // CREATE
  const createMutation =
    api.historyGuruKelas.createHistoryGuruKelas.useMutation({
      onSuccess: async (data, variables) => {
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
      onSuccess: async (data, variables) => {
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
      onSuccess: async (data, variables) => {
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

  return {
    // data: kelasQuery.data,
    // isLoading: kelasQuery.isLoading,
    // isError: kelasQuery.isError,
    // error: kelasQuery.error,

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
    },

    // Utils untuk manual invalidation jika perlu
    // refetch: kelasQuery.refetch,
    refetchById: historyGuruKelasQuery.refetch,
    invalidate: () => apiUtils.kelas.getAll.invalidate(),
  };
}
