"use client";

import { api } from "@/trpc/react";
import type { TypeJamTetap, TypeJamCustom } from "@/types/jam.type";
import { toast } from "sonner";

interface useJamOptions {
  // Query options
  enableQueryJamTetap?: boolean;
  enableQueryJamCustom?: boolean;

  initialDataJamTetap?: TypeJamTetap[];
  initialDataJamCustom?: TypeJamCustom[];

  filterCabang?: string;

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
  const cabangIdPayload =
    options?.filterCabang !== "ALL" ? options?.filterCabang : undefined;

  // ========== QUERIES ==========

  const JamTetapQuery = api.jam.getAllJamTetap.useQuery(
    { cabangId: cabangIdPayload },
    {
      enabled: options?.enableQueryJamTetap ?? true,
      initialData: options?.initialDataJamTetap,
    },
  );

  const JamCustomQuery = api.jam.getAllJamCustom.useQuery(undefined, {
    enabled: options?.enableQueryJamCustom ?? true,
    initialData: options?.initialDataJamCustom,
  });

  const invalidateJam = async () => {
    await Promise.all([
      apiUtils.jam.getAllJamTetap.invalidate(),
      apiUtils.jam.getAllJamCustom.invalidate(),
    ]);
  };

  // ========== MUTATIONS ==========

  // CREATE
  const createMutationTetap = api.jam.createJamTetap.useMutation({
    onSuccess: async () => {
      await apiUtils.jam.getAllJamTetap.invalidate();
      toast.success("Jam berhasil dibuat");
      options?.onSuccessCreate?.();
    },
    onError: (error) => {
      toast.error(`Gagal membuat Jam: ${error.message}`);
    },
  });

  const createMutationCustom = api.jam.createJamCustom.useMutation({
    onSuccess: async () => {
      await apiUtils.jam.getAllJamCustom.invalidate();
      toast.success("Jam berhasil dibuat");
      options?.onSuccessCreate?.();
    },
    onError: (error) => {
      toast.error(`Gagal membuat Jam: ${error.message}`);
    },
  });

  // UPDATE

  const updateMutationTetap = api.jam.updateJamTetap.useMutation({
    onSuccess: async () => {
      await apiUtils.jam.getAllJamTetap.invalidate();
      toast.success("Jam berhasil diupdate");
      options?.onSuccessUpdate?.();
    },
    onError: (error) => {
      toast.error(`Gagal mengupdate Jam: ${error.message}`);
    },
  });

  const updateMutationCustom = api.jam.updateJamCustom.useMutation({
    onSuccess: async () => {
      await apiUtils.jam.getAllJamCustom.invalidate();
      toast.success("Jam berhasil diupdate");
      options?.onSuccessUpdate?.();
    },
    onError: (error) => {
      toast.error(`Gagal mengupdate Jam: ${error.message}`);
    },
  });

  // DELETE
  const deleteMutationTetap = api.jam.deleteJamTetap.useMutation({
    onSuccess: async () => {
      await apiUtils.jam.getAllJamTetap.invalidate();
      toast.success("Jam berhasil dihapus");
      options?.onSuccessDelete?.();
    },
    onError: (error) => {
      toast.error(`Gagal menghapus Jam: ${error.message}`);
    },
  });
  const deleteMutationCustom = api.jam.deleteJamCustom.useMutation({
    onSuccess: async () => {
      await apiUtils.jam.getAllJamCustom.invalidate();
      toast.success("Jam berhasil dihapus");
      options?.onSuccessDelete?.();
    },
    onError: (error) => {
      toast.error(`Gagal menghapus Jam: ${error.message}`);
    },
  });

  return {
    // Query results
    dataJamTetap: JamTetapQuery.data,
    isLoadingJamTetap: JamTetapQuery.isLoading,
    isErrorJamTetap: JamTetapQuery.isError,
    errorJamTetap: JamTetapQuery.error,

    dataJamCustom: JamCustomQuery.data,
    isLoadingJamCustom: JamCustomQuery.isLoading,
    isErrorJamCustom: JamCustomQuery.isError,
    errorJamCustom: JamCustomQuery.error,

    // Mutations
    tetapMutations: {
      create: {
        mutate: createMutationTetap.mutate,
        mutateAsync: createMutationTetap.mutateAsync,
        isPending: createMutationTetap.isPending,
      },
      update: {
        mutate: updateMutationTetap.mutate,
        mutateAsync: updateMutationTetap.mutateAsync,
        isPending: updateMutationTetap.isPending,
      },
      delete: {
        mutate: deleteMutationTetap.mutate,
        mutateAsync: deleteMutationTetap.mutateAsync,
        isPending: deleteMutationTetap.isPending,
      },
    },

    customMutations: {
      create: {
        mutate: createMutationCustom.mutate,
        mutateAsync: createMutationCustom.mutateAsync,
        isPending: createMutationCustom.isPending,
      },
      update: {
        mutate: updateMutationCustom.mutate,
        mutateAsync: updateMutationCustom.mutateAsync,
        isPending: updateMutationCustom.isPending,
      },
      delete: {
        mutate: deleteMutationCustom.mutate,
        mutateAsync: deleteMutationCustom.mutateAsync,
        isPending: deleteMutationCustom.isPending,
      },
    },

    // Utils untuk manual invalidation jika perlu
    refetchTetap: JamTetapQuery.refetch,
    refetchCustom: JamCustomQuery.refetch,
    invalidate: invalidateJam,
  };
}
