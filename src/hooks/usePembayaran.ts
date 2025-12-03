"use client";

import { api } from "@/trpc/react";
import { toast } from "sonner";
import type { RouterOutputs } from "@/trpc/react";
import type { StatusPembayaran } from "@prisma/client";
import type { PaginationState } from "@tanstack/react-table";
import { keepPreviousData } from "@tanstack/react-query";
import type { Type } from "typescript";
import type { TypePembayaranPaginated } from "@/types/pembayaran.type";

// Define types based on Router Outputs for easier usage in components
export type PembayaranData = RouterOutputs["pembayaran"]["getAll"][number];
export type PembayaranJatuhTempoData =
  RouterOutputs["pembayaran"]["getTagihanJatuhTempo"][number];
export type SaldoSiswaData = RouterOutputs["pembayaran"]["getSaldoSiswa"];

interface UsePembayaranOptions {
  // Query options
  enableGetAll?: boolean;
  enableGetJatuhTempo?: boolean;
  enableGetHistoryByMuridId?: boolean;

  initialDataPaginated?: TypePembayaranPaginated;

  // Pagination & Filter
  pagination?: PaginationState;
  statusFilter?: StatusPembayaran | "ALL";
  muridIdFilter?: string;
  searchFilter?: string;

  // Mutation callbacks
  onSuccessUpdate?: () => void;
  onSuccessDelete?: () => void;
  onSuccessCreateManual?: () => void;
}

/**
 * Custom hook to manage Pembayaran (Queries + Mutations)
 */
export function usePembayaran(options?: UsePembayaranOptions) {
  const apiUtils = api.useUtils();

  const pageIndex = options?.pagination?.pageIndex ?? 0;
  const pageSize = options?.pagination?.pageSize ?? 10;
  const shouldUseInitialData = pageIndex === 0 && pageSize === 10;

  const invalidatePayments = async () => {
    await Promise.all([
      apiUtils.pembayaran.getAllPaginated.invalidate(),
      apiUtils.pembayaran.getTagihanJatuhTempo.invalidate(),
      // TAMBAHAN: Invalidate list detail & saldo siswa
      apiUtils.pembayaran.getAll.invalidate(),
      apiUtils.pembayaran.getSaldoSiswa.invalidate(),
      apiUtils.pembayaran.getSaldoByMuridId.invalidate(),
    ]);
  };

  // ========== QUERIES ==========

  // 1. Get All Pembayaran (with optional filters)
  const getAllQuery = api.pembayaran.getAll.useQuery(
    options?.statusFilter || options?.muridIdFilter
      ? {
          status:
            options?.statusFilter && options.statusFilter !== "ALL"
              ? options.statusFilter
              : undefined,
          muridId: options?.muridIdFilter,
        }
      : undefined,
    {
      enabled: options?.enableGetAll ?? false,
      refetchOnWindowFocus: true, // Keep data fresh
    },
  );

  const getAllPaginatedQuery = api.pembayaran.getAllPaginated.useQuery(
    {
      pageIndex,
      pageSize,
      status:
        options?.statusFilter && options.statusFilter !== "ALL"
          ? options.statusFilter
          : undefined,
      muridId: options?.muridIdFilter,
      search: options?.searchFilter,
    },
    {
      enabled: options?.enableGetAll ?? true,
      placeholderData: keepPreviousData,
      initialData: shouldUseInitialData
        ? options?.initialDataPaginated
        : undefined,
    },
  );

  // 2. Get Tagihan Jatuh Tempo (Dashboard)
  const getJatuhTempoQuery = api.pembayaran.getTagihanJatuhTempo.useQuery(
    undefined,
    {
      enabled: options?.enableGetJatuhTempo ?? false, // Default false unless requested
      refetchOnWindowFocus: true,
    },
  );

  // 3. Get Saldo Siswa (Helper wrapper)
  // Usage: const { data: saldo } = usePembayaran().getSaldoSiswaQuery({ pendaftaranKelasId: "..." })
  // Note: We expose the hook creator itself so components can call it with specific IDs
  const getSaldoSiswaQuery = api.pembayaran.getSaldoSiswa.useQuery;

  const getSaldoByMuridIdQuery = api.pembayaran.getSaldoByMuridId.useQuery;

  // ========== MUTATIONS ==========

  // 1. Update Status Pembayaran
  const updateMutation = api.pembayaran.updatePembayaran.useMutation({
    onSuccess: async () => {
      await invalidatePayments();
      toast.success("Data pembayaran berhasil diperbarui");
      options?.onSuccessUpdate?.();
    },
    onError: (error) => {
      toast.error(`Gagal update pembayaran: ${error.message}`);
    },
  });

  // 2. Delete Pembayaran
  const deleteMutation = api.pembayaran.deletePembayaran.useMutation({
    onSuccess: async () => {
      await invalidatePayments();
      toast.success("Data pembayaran berhasil dihapus");
      options?.onSuccessDelete?.();
    },
    onError: (error) => {
      toast.error(`Gagal menghapus: ${error.message}`);
    },
  });

  // 3. Create Manual Tagihan
  const createManualMutation = api.pembayaran.createManualTagihan.useMutation({
    onSuccess: async () => {
      await invalidatePayments();
      toast.success("Pembayaran manual berhasil dibuat");
      options?.onSuccessCreateManual?.();
    },
    onError: (error) => {
      toast.error(`Gagal membuat pembayaran: ${error.message}`);
    },
  });

  return {
    // Query Results
    dataGetAll: getAllQuery.data ?? [],
    isLoadingGetAll: getAllQuery.isLoading,
    isErrorGetAll: getAllQuery.isError,
    errorGetAll: getAllQuery.error,
    refetchGetAll: getAllQuery.refetch,

    dataGetAllPaginated: getAllPaginatedQuery.data?.data ?? [],
    pageCount: getAllPaginatedQuery.data?.pageCount ?? -1,
    totalRows: getAllPaginatedQuery.data?.total ?? 0,
    isLoadingGetAllPaginated: getAllPaginatedQuery.isLoading,
    isFetchingGetAllPaginated: getAllPaginatedQuery.isFetching,
    isErrorGetAllPaginated: getAllPaginatedQuery.isError,
    errorGetAllPaginated: getAllPaginatedQuery.error,
    refetchGetAllPaginated: getAllPaginatedQuery.refetch,

    dataJatuhTempo: getJatuhTempoQuery.data ?? [],
    isLoadingJatuhTempo: getJatuhTempoQuery.isLoading,
    isErrorJatuhTempo: getJatuhTempoQuery.isError,
    isRefetchingJatuhTempo: getJatuhTempoQuery.isFetching,
    errorJatuhTempo: getJatuhTempoQuery.error,
    refetchJatuhTempo: getJatuhTempoQuery.refetch,

    // Expose Query Hook for specific ID usage
    getSaldoSiswaQuery,

    getSaldoByMuridIdQuery,

    // Mutations
    mutations: {
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
      createManual: {
        mutate: createManualMutation.mutate,
        mutateAsync: createManualMutation.mutateAsync,
        isPending: createManualMutation.isPending,
      },
    },

    // Utils
    invalidateAll: () => apiUtils.pembayaran.invalidate(),
  };
}
