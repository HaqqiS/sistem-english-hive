"use client";

import { api } from "@/trpc/react";
import type {
  TypeMuridNotRegistered,
  TypeAllMurid,
  TypeMuridNotRegisteredPaginated,
  TypeAllMuridPaginated,
} from "@/types/murid.type";
import { keepPreviousData } from "@tanstack/react-query";
import type { PaginationState } from "@tanstack/react-table";
import { toast } from "sonner";

interface useMuridOptions {
  // Query options
  enableQuery?: boolean;
  initialDataNotRegistered?: TypeMuridNotRegistered[];
  initialDataNotRegisteredPaginated?: TypeMuridNotRegisteredPaginated;
  initialDataAllMurid?: TypeAllMurid[];
  initialDataAllPaginated?: TypeAllMuridPaginated;

  pagination?: PaginationState;

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
export function useMurid(options?: useMuridOptions) {
  const apiUtils = api.useUtils();
  const pageIndex = options?.pagination?.pageIndex ?? 0;
  const pageSize = options?.pagination?.pageSize ?? 10;
  const shouldUseInitialData = pageIndex === 0 && pageSize === 10;

  // ========== QUERIES ==========
  const MuridNotRegisteredQuery = api.murid.getMuridWhereNotRegistered.useQuery(
    undefined,
    {
      enabled: options?.enableQuery ?? true,
      initialData: options?.initialDataNotRegistered,
    },
  );

  const MuridNotRegisteredPaginatedQuery =
    api.murid.getMuridNotRegisteredPaginated.useQuery(
      { pageIndex, pageSize },
      {
        enabled: !!options?.pagination,
        placeholderData: keepPreviousData,
        initialData: shouldUseInitialData
          ? options?.initialDataNotRegisteredPaginated
          : undefined,
      },
    );

  const MuridQuery = api.murid.getAllMurid.useQuery(undefined, {
    enabled: options?.enableQuery ?? true,
    initialData: options?.initialDataAllMurid,
  });

  const MuridPaginatedQuery = api.murid.getAllPaginated.useQuery(
    { pageIndex, pageSize },
    {
      enabled: !!options?.pagination,
      placeholderData: keepPreviousData,
      initialData: shouldUseInitialData
        ? options?.initialDataAllPaginated
        : undefined,
    },
  );

  // ========== MUTATIONS ==========

  // CREATE
  const createMutation = api.murid.registerMurid.useMutation({
    onSuccess: async () => {
      await apiUtils.murid.getMuridWhereNotRegistered.invalidate();
      await apiUtils.murid.getAllPaginated.invalidate();
      toast.success("Murid berhasil didaftarkan");
      options?.onSuccessCreate?.();
    },
    onError: (error) => {
      toast.error(`Gagal mendaftar Murid: ${error.message}`);
    },
  });

  // UPDATE

  const updateStatusMuridMutation = api.murid.updateStatusMurid.useMutation({
    onSuccess: async () => {
      await apiUtils.murid.getMuridWhereNotRegistered.invalidate();
      await apiUtils.murid.getAllPaginated.invalidate();
      toast.success("Status Murid berhasil diupdate");
      options?.onSuccessUpdate?.();
    },
    onError: (error) => {
      toast.error(`Gagal mengupdate Status Murid: ${error.message}`);
    },
  });
  const updateMutation = api.murid.updateMurid.useMutation({
    onSuccess: async () => {
      await apiUtils.murid.getAllPaginated.invalidate();
      toast.success("Murid berhasil diupdate");
      options?.onSuccessUpdate?.();
    },
    onError: (error) => {
      toast.error(`Gagal mengupdate Murid: ${error.message}`);
    },
  });

  // DELETE
  const deleteMutation = api.murid.deleteMurid.useMutation({
    onSuccess: async () => {
      await apiUtils.murid.getAllPaginated.invalidate();
      await apiUtils.murid.getMuridWhereNotRegistered.invalidate();
      toast.success("Murid berhasil dihapus");
      options?.onSuccessDelete?.();
    },
    onError: (error) => {
      toast.error(`Gagal menghapus Murid: ${error.message}`);
    },
  });

  return {
    // Query results
    dataMuridNotRegistered: MuridNotRegisteredQuery.data,
    isLoadingMuridNotRegistered: MuridNotRegisteredQuery.isLoading,
    isErrorMuridNotRegistered: MuridNotRegisteredQuery.isError,
    errorMuridNotRegistered: MuridNotRegisteredQuery.error,

    dataNotRegisteredPaginated:
      MuridNotRegisteredPaginatedQuery.data?.data ?? [],
    pageCountNotRegistered:
      MuridNotRegisteredPaginatedQuery.data?.pageCount ?? -1,
    totalRowsNotRegistered: MuridNotRegisteredPaginatedQuery.data?.total ?? 0,
    isLoadingNotRegisteredPaginated: MuridNotRegisteredPaginatedQuery.isLoading,
    isFetchingNotRegisteredPaginated:
      MuridNotRegisteredPaginatedQuery.isFetching,
    isErrorNotRegisteredPaginated: MuridNotRegisteredPaginatedQuery.isError,
    errorNotRegisteredPaginated: MuridNotRegisteredPaginatedQuery.error,

    dataAllMurid: MuridQuery.data,
    isLoadingAllMurid: MuridQuery.isLoading,
    isErrorAllMurid: MuridQuery.isError,
    errorAllMurid: MuridQuery.error,

    dataAllMuridPaginated: MuridPaginatedQuery.data?.data ?? [],
    pageCount: MuridPaginatedQuery.data?.pageCount ?? -1,
    totalRows: MuridPaginatedQuery.data?.total ?? 0,
    isLoadingAllMuridPaginated: MuridPaginatedQuery.isLoading,
    isFetchingAllMuridPaginated: MuridPaginatedQuery.isFetching,
    isErrorAllMuridPaginated: MuridPaginatedQuery.isError,
    errorAllMuridPaginated: MuridPaginatedQuery.error,

    // Mutations
    mutations: {
      create: {
        mutate: createMutation.mutate,
        mutateAsync: createMutation.mutateAsync,
        isPending: createMutation.isPending,
      },
      updateStatus: {
        mutate: updateStatusMuridMutation.mutate,
        mutateAsync: updateStatusMuridMutation.mutateAsync,
        isPending: updateStatusMuridMutation.isPending,
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
    refetchPaginated: MuridPaginatedQuery.refetch,
    refetchNotRegisteredPaginated: MuridNotRegisteredPaginatedQuery.refetch,
    // invalidate: () => apiUtils.murid.getMuridWhereNotRegistered.invalidate(),
  };
}
