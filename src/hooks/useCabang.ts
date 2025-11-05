"use client";

import { api } from "@/trpc/react";
import { toast } from "sonner";
import type { CabangType } from "@/types/cabang.type";

interface UseCabangOptions {
  // Query options
  enableQuery?: boolean;
  initialData?: CabangType[];

  // Mutation callbacks
  onSuccessCreate?: () => void;
  onSuccessUpdate?: () => void;
  onSuccessDelete?: () => void;
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
export function useCabang(options?: UseCabangOptions) {
  const apiUtils = api.useUtils();

  // ========== QUERIES ==========
  const cabangQuery = api.cabang.getAll.useQuery(undefined, {
    enabled: options?.enableQuery ?? true,
    initialData: options?.initialData,
  });

  // ========== MUTATIONS ==========

  // CREATE
  const createMutation = api.cabang.createCabang.useMutation({
    onSuccess: async () => {
      await apiUtils.cabang.getAll.invalidate();
      toast.success("Cabang berhasil ditambahkan");
      options?.onSuccessCreate?.();
    },
    onError: (error) => {
      toast.error(`Gagal membuat cabang: ${error.message}`);
    },
  });

  // UPDATE
  const updateMutation = api.cabang.updateCabang.useMutation({
    onSuccess: async () => {
      await apiUtils.cabang.getAll.invalidate();
      toast.success("Cabang berhasil diupdate");
      options?.onSuccessUpdate?.();
    },
    onError: (error) => {
      toast.error(`Gagal mengupdate cabang: ${error.message}`);
    },
  });

  // DELETE
  const deleteMutation = api.cabang.deleteCabang.useMutation({
    onSuccess: async () => {
      await apiUtils.cabang.getAll.invalidate();
      toast.success("Cabang berhasil dihapus");
      options?.onSuccessDelete?.();
    },
    onError: (error) => {
      toast.error(`Gagal menghapus cabang: ${error.message}`);
    },
  });

  return {
    // Query results
    data: cabangQuery.data,
    isLoading: cabangQuery.isLoading,
    isError: cabangQuery.isError,
    error: cabangQuery.error,

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
    refetch: cabangQuery.refetch,
    invalidate: () => apiUtils.cabang.getAll.invalidate(),
  };
}
