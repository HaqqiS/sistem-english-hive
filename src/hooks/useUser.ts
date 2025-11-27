"use client";
import { api } from "@/trpc/react";
import type { TypeGuruSimple, TypeGuruComplete } from "@/types/user.type";
import { toast } from "sonner";

interface UseGuruOptions {
  // Query options
  enableQuery?: boolean;
  initialDataGuru?: TypeGuruSimple[];
  initialDataGuruComplete?: TypeGuruComplete[];

  // Mutation callbacks
  onSuccessCreate?: () => void;
  onSuccessUpdate?: () => void;
  onSuccessDelete?: () => void;
  onSuccessResetPassword?: () => void;
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
export function useUser(options?: UseGuruOptions) {
  const apiUtils = api.useUtils();

  // ========== QUERIES ==========
  const getAllGuruQuery = api.user.getAllGuruSimple.useQuery(undefined, {
    enabled: options?.enableQuery ?? true,
    initialData: options?.initialDataGuru,
  });
  const getAllGuruCompleteQuery = api.user.getAllGuruComplete.useQuery(
    undefined,
    {
      enabled: options?.enableQuery ?? false,
      initialData: options?.initialDataGuruComplete,
    },
  );

  // ========== MUTATIONS ==========

  // CREATE
  const registrationMutation = api.user.createGuru.useMutation({
    onSuccess: async () => {
      await apiUtils.user.getAllGuruSimple.invalidate();
      await apiUtils.user.getAllGuruComplete.invalidate();
      toast.success("Guru berhasil ditambahkan");
      options?.onSuccessCreate?.();
    },
    onError: (error) => {
      toast.error(`Gagal membuat Guru: ${error.message}`);
    },
  });

  // UPDATE
  const updateMutation = api.user.updateGuru.useMutation({
    onSuccess: async () => {
      await apiUtils.user.getAllGuruSimple.invalidate();
      await apiUtils.user.getAllGuruComplete.invalidate();
      toast.success("Guru berhasil diupdate");
      options?.onSuccessUpdate?.();
    },
    onError: (error) => {
      toast.error(`Gagal mengupdate guru: ${error.message}`);
    },
  });
  const resetPasswordMutation = api.user.resetPasswordGuru.useMutation({
    onSuccess: async () => {
      await apiUtils.user.getAllGuruComplete.invalidate();
      toast.success("Password guru berhasil direset");
      options?.onSuccessResetPassword?.();
    },
    onError: (error) => {
      toast.error(`Gagal mereset password guru: ${error.message}`);
    },
  });

  // DELETE
  const deleteMutation = api.user.deleteGuru.useMutation({
    onSuccess: async () => {
      await apiUtils.user.getAllGuruSimple.invalidate();
      await apiUtils.user.getAllGuruComplete.invalidate();
      toast.success("Guru berhasil dihapus");
      options?.onSuccessDelete?.();
    },
    onError: (error) => {
      toast.error(`Gagal menghapus guru: ${error.message}`);
    },
  });

  return {
    // Query results
    data: getAllGuruQuery.data,
    isLoading: getAllGuruQuery.isLoading,
    isError: getAllGuruQuery.isError,
    error: getAllGuruQuery.error,

    dataComplete: getAllGuruCompleteQuery.data,
    isLoadingComplete: getAllGuruCompleteQuery.isLoading,
    isErrorComplete: getAllGuruCompleteQuery.isError,
    errorComplete: getAllGuruCompleteQuery.error,

    // Mutations
    mutations: {
      registration: {
        mutate: registrationMutation.mutate,
        mutateAsync: registrationMutation.mutateAsync,
        isPending: registrationMutation.isPending,
      },
      update: {
        mutate: updateMutation.mutate,
        mutateAsync: updateMutation.mutateAsync,
        isPending: updateMutation.isPending,
      },
      resetPassword: {
        mutate: resetPasswordMutation.mutate,
        mutateAsync: resetPasswordMutation.mutateAsync,
        isPending: resetPasswordMutation.isPending,
      },
      delete: {
        mutate: deleteMutation.mutate,
        mutateAsync: deleteMutation.mutateAsync,
        isPending: deleteMutation.isPending,
      },
    },

    // Utils untuk manual invalidation jika perlu
    refetchGuru: getAllGuruQuery.refetch,
    refetchGuruComplete: getAllGuruCompleteQuery.refetch,
    invalidateGuru: () => apiUtils.user.getAllGuruSimple.invalidate(),
    invalidateGuruComplete: () => apiUtils.user.getAllGuruComplete.invalidate(),
  };
}
