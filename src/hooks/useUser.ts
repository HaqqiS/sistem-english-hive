"use client";
import { api } from "@/trpc/react";
import type { TypeGuruSimple, TypeGuruComplete } from "@/types/user.type";
import { toast } from "sonner";

interface UseGuruOptions {
  // Query options
  enableQuery?: boolean;
  initialDataGuru?: TypeGuruSimple[];
  initialDataGuruComplete?: TypeGuruComplete[];

  filterCabang?: string;

  // Mutation callbacks
  onSuccessCreate?: () => void;
  onSuccessUpdate?: () => void;
  onSuccessDelete?: () => void;
  onSuccessResetPassword?: () => void;
}

export function useUser(options?: UseGuruOptions) {
  const apiUtils = api.useUtils();
  const cabangIdPayload =
    options?.filterCabang !== "ALL" ? options?.filterCabang : undefined;

  // ========== QUERIES ==========
  const getAllGuruQuery = api.user.getAllGuruSimple.useQuery(
    { cabangId: cabangIdPayload },
    {
      enabled: options?.enableQuery ?? true,
      initialData: options?.initialDataGuru,
    },
  );
  const getAllGuruCompleteQuery = api.user.getAllGuruComplete.useQuery(
    { cabangId: cabangIdPayload },
    {
      enabled: options?.enableQuery ?? false,
      initialData: options?.initialDataGuruComplete,
    },
  );

  const invalidateUsers = async () => {
    await Promise.all([
      apiUtils.user.getAllGuruSimple.invalidate(),
      apiUtils.user.getAllGuruComplete.invalidate(),
    ]);
  };

  // ========== MUTATIONS ==========

  // CREATE
  const registrationMutation = api.user.createGuru.useMutation({
    onSuccess: async () => {
      await invalidateUsers();
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
      await invalidateUsers();
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
      await invalidateUsers();
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
    invalidate: invalidateUsers,
  };
}
