"use client";

import { api } from "@/trpc/react";
import { toast } from "sonner";
import type { RuangType } from "@/types/ruang.type";

interface UseRuangOptions {
  // Query options
  enableQuery?: boolean;
  initialData?: RuangType[];

  // Mutation callbacks
  onSuccessCreate?: () => void;
  onSuccessUpdate?: () => void;
  onSuccessDelete?: () => void;
}

/**
 * Custom hook untuk mengelola Ruang (Queries + Mutations)
 *
 * @example
 * // Hanya butuh data Ruang
 * const { data: RuangList } = useRuang();
 *
 * // Butuh data + mutations
 * const { data, mutations } = useRuang({
 *   onSuccessCreate: () => console.log("Created!")
 * });
 */
export function useRuang(options?: UseRuangOptions) {
  const apiUtils = api.useUtils();

  // ========== QUERIES ==========
  // const RuangQuery = api.ruang.getRuangByCabangId.useQuery(undefined, {
  //   enabled: options?.enableQuery ?? true,
  //   initialData: options?.initialData,
  // });

  const RuangQuery = api.ruang.getAll.useQuery(undefined, {
    enabled: options?.enableQuery ?? true,
    initialData: options?.initialData,
  });

  // ========== MUTATIONS ==========

  // CREATE
  const createMutation = api.ruang.createRuang.useMutation({
    onSuccess: async () => {
      await apiUtils.ruang.getAll.invalidate();
      toast.success("Ruang berhasil ditambahkan");
      options?.onSuccessCreate?.();
    },
    onError: (error) => {
      toast.error(`Gagal membuat Ruang: ${error.message}`);
    },
  });

  // UPDATE
  const updateMutation = api.ruang.updateRuang.useMutation({
    onSuccess: async () => {
      await apiUtils.ruang.getAll.invalidate();
      toast.success("Ruang berhasil diupdate");
      options?.onSuccessUpdate?.();
    },
    onError: (error) => {
      toast.error(`Gagal mengupdate Ruang: ${error.message}`);
    },
  });

  // DELETE
  const deleteMutation = api.ruang.deleteRuang.useMutation({
    onSuccess: async () => {
      await apiUtils.ruang.getAll.invalidate();
      toast.success("Ruang berhasil dihapus");
      options?.onSuccessDelete?.();
    },
    onError: (error) => {
      toast.error(`Gagal menghapus Ruang: ${error.message}`);
    },
  });

  return {
    // Query results
    data: RuangQuery.data,
    isLoading: RuangQuery.isLoading,
    isError: RuangQuery.isError,
    error: RuangQuery.error,

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
    refetch: RuangQuery.refetch,
    invalidate: () => apiUtils.ruang.getAll.invalidate(),
  };
}
