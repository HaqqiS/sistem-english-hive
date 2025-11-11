"use client";

import { api } from "@/trpc/react";
import type { TypeJam } from "@/types/jam.type";
import { toast } from "sonner";

interface useJamOptions {
  // Query options
  enableQuery?: boolean;
  initialData?: TypeJam[];

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
export function useJam(options?: useJamOptions) {
  const apiUtils = api.useUtils();

  // ========== QUERIES ==========

  const JamQuery = api.jam.getAll.useQuery(undefined, {
    enabled: options?.enableQuery ?? true,
    initialData: options?.initialData,
  });

  // ========== MUTATIONS ==========

  // CREATE
  const createMutation = api.jam.createJam.useMutation({
    onSuccess: async () => {
      await apiUtils.jam.getAll.invalidate();
      toast.success("Jam berhasil dibuat");
      options?.onSuccessCreate?.();
    },
    onError: (error) => {
      toast.error(`Gagal membuat Jam: ${error.message}`);
    },
  });

  // UPDATE

  // const updateStatusMuridMutation = api.murid.updateStatusMurid.useMutation({
  //   onSuccess: async () => {
  //     await apiUtils.murid.getMuridWhereNotRegistered.invalidate();
  //     toast.success("Status Murid berhasil diupdate");
  //     options?.onSuccessUpdate?.();
  //   },
  //   onError: (error) => {
  //     toast.error(`Gagal mengupdate Status Murid: ${error.message}`);
  //   },
  // });
  const updateMutation = api.jam.updateJam.useMutation({
    onSuccess: async () => {
      await apiUtils.jam.getAll.invalidate();
      toast.success("Jam berhasil diupdate");
      options?.onSuccessUpdate?.();
    },
    onError: (error) => {
      toast.error(`Gagal mengupdate Jam: ${error.message}`);
    },
  });

  // DELETE
  const deleteMutation = api.jam.deleteJam.useMutation({
    onSuccess: async () => {
      await apiUtils.jam.getAll.invalidate();
      toast.success("Jam berhasil dihapus");
      options?.onSuccessDelete?.();
    },
    onError: (error) => {
      toast.error(`Gagal menghapus Jam: ${error.message}`);
    },
  });

  return {
    // Query results
    dataJam: JamQuery.data,
    isLoadingJam: JamQuery.isLoading,
    isErrorJam: JamQuery.isError,
    errorJam: JamQuery.error,

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
    refetch: JamQuery.refetch,
    invalidate: () => apiUtils.jam.getAll.invalidate(),
  };
}
