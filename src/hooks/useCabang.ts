"use client";

import { api } from "@/trpc/react";
import { toast } from "sonner";
import type { CabangType } from "@/types/cabang.type";
import type { PaginationState } from "@tanstack/react-table";
import { keepPreviousData } from "@tanstack/react-query";

interface UseCabangOptions {
  // Query options
  enableQuery?: boolean;
  initialDataPaginated?: { data: CabangType[]; pageCount: number };
  initialDataList?: CabangType[];
  pagination?: PaginationState;

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

  const pageIndex = options?.pagination?.pageIndex ?? 0;
  const pageSize = options?.pagination?.pageSize ?? 10;

  // ========== QUERIES ==========
  const paginatedQuery = api.cabang.getAllPaginated.useQuery(
    { pageIndex, pageSize },
    {
      enabled: (options?.enableQuery ?? true) && !!options?.pagination, // Aktif HANYA jika pagination diberikan
      initialData: options?.initialDataPaginated,
      placeholderData: keepPreviousData,
    },
  );

  const listQuery = api.cabang.getAllList.useQuery(undefined, {
    enabled: (options?.enableQuery ?? true) && !options?.pagination, // Aktif HANYA jika pagination TIDAK diberikan
    initialData: options?.initialDataList,
    refetchOnWindowFocus: false,
  });
  // ========== MUTATIONS ==========
  const invalidateAll = async () => {
    await apiUtils.cabang.getAllPaginated.invalidate();
    await apiUtils.cabang.getAllList.invalidate();
  };

  // CREATE
  const createMutation = api.cabang.createCabang.useMutation({
    onSuccess: async () => {
      await apiUtils.cabang.getAllPaginated.invalidate();
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
      await apiUtils.cabang.getAllPaginated.invalidate();
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
      await apiUtils.cabang.getAllPaginated.invalidate();
      toast.success("Cabang berhasil dihapus");
      options?.onSuccessDelete?.();
    },
    onError: (error) => {
      toast.error(`Gagal menghapus cabang: ${error.message}`);
    },
  });

  const isPaginated = !!options?.pagination;

  return {
    // Query results
    data: isPaginated
      ? (paginatedQuery.data?.data ?? [])
      : (listQuery.data ?? []),
    pageCount: isPaginated ? (paginatedQuery.data?.pageCount ?? 0) : 0, // <-- Kembalikan pageCount
    isLoading: isPaginated ? paginatedQuery.isLoading : listQuery.isLoading,
    isError: isPaginated ? paginatedQuery.isError : listQuery.isError,
    error: isPaginated ? paginatedQuery.error : listQuery.error,
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
    refetch: isPaginated ? paginatedQuery.refetch : listQuery.refetch,
    invalidate: invalidateAll,
  };
}
