"use client";

import { api } from "@/trpc/react";
import { toast } from "sonner";
import type { CabangType } from "@/types/cabang.type";
import { keepPreviousData } from "@tanstack/react-query";

interface UseCabangOptions {
  // Query options
  enableQuery?: boolean;
  enableQueryList?: boolean;
  initialData?: CabangType[];
  initialDataList?: CabangType[];

  filterCabang?: string;

  // Mutation callbacks
  onSuccessCreate?: () => void;
  onSuccessUpdate?: () => void;
  onSuccessDelete?: () => void;
}

export function useCabang(options?: UseCabangOptions) {
  const apiUtils = api.useUtils();
  const cabangIdPayload =
    options?.filterCabang !== "ALL" ? options?.filterCabang : undefined;

  // ========== QUERIES ==========
  const cabangQuery = api.cabang.getAll.useQuery(undefined, {
    enabled: options?.enableQuery ?? false,
    initialData: options?.initialData,
    placeholderData: keepPreviousData,
  });

  const listQuery = api.cabang.getAllList.useQuery(undefined, {
    enabled: options?.enableQueryList ?? false,
    initialData: options?.initialDataList,
    refetchOnWindowFocus: false,
  });
  // ========== MUTATIONS ==========
  const invalidateAll = async () => {
    await apiUtils.cabang.getAll.invalidate();
    await apiUtils.cabang.getAllList.invalidate();
  };

  // CREATE
  const createMutation = api.cabang.createCabang.useMutation({
    onSuccess: async () => {
      await apiUtils.cabang.getAll.invalidate();
      await apiUtils.cabang.getAllList.invalidate();
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
      await apiUtils.cabang.getAllList.invalidate();
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
      await apiUtils.cabang.getAllList.invalidate();

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

    dataList: listQuery.data,
    isLoadingList: listQuery.isLoading,
    isErrorList: listQuery.isError,
    errorList: listQuery.error,
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
    invalidate: invalidateAll,
  };
}
