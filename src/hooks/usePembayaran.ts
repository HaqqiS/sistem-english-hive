"use client";

import { api } from "@/trpc/react";
import { toast } from "sonner";
import type { RouterOutputs } from "@/trpc/react";
import type { StatusPembayaran } from "@prisma/client";

// Define types based on Router Outputs for easier usage in components
export type PembayaranData = RouterOutputs["pembayaran"]["getAll"][number];
export type PembayaranJatuhTempoData =
  RouterOutputs["pembayaran"]["getTagihanJatuhTempo"][number];
export type SaldoSiswaData = RouterOutputs["pembayaran"]["getSaldoSiswa"];

interface UsePembayaranOptions {
  // Query options
  enableGetAll?: boolean;
  enableGetJatuhTempo?: boolean;

  // Filter options for getAll
  statusFilter?: StatusPembayaran;
  muridIdFilter?: string;

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

  // ========== QUERIES ==========

  // 1. Get All Pembayaran (with optional filters)
  const getAllQuery = api.pembayaran.getAll.useQuery(
    options?.statusFilter || options?.muridIdFilter
      ? {
          status: options.statusFilter,
          muridId: options.muridIdFilter,
        }
      : undefined,
    {
      enabled: options?.enableGetAll ?? true,
      refetchOnWindowFocus: true, // Keep data fresh
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

  // ========== MUTATIONS ==========

  // 1. Update Status Pembayaran
  const updateMutation = api.pembayaran.updatePembayaran.useMutation({
    onSuccess: async () => {
      await apiUtils.pembayaran.getAll.invalidate();
      await apiUtils.pembayaran.getTagihanJatuhTempo.invalidate();
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
      await apiUtils.pembayaran.getAll.invalidate();
      await apiUtils.pembayaran.getTagihanJatuhTempo.invalidate();

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
      await apiUtils.pembayaran.getAll.invalidate();
      await apiUtils.pembayaran.getTagihanJatuhTempo.invalidate();

      toast.success("Tagihan manual berhasil dibuat");
      options?.onSuccessCreateManual?.();
    },
    onError: (error) => {
      toast.error(`Gagal membuat tagihan: ${error.message}`);
    },
  });

  return {
    // Query Results
    dataGetAll: getAllQuery.data ?? [],
    isLoadingGetAll: getAllQuery.isLoading,
    isErrorGetAll: getAllQuery.isError,
    errorGetAll: getAllQuery.error,
    refetchGetAll: getAllQuery.refetch,

    dataJatuhTempo: getJatuhTempoQuery.data ?? [],
    isLoadingJatuhTempo: getJatuhTempoQuery.isLoading,
    isErrorJatuhTempo: getJatuhTempoQuery.isError,
    errorJatuhTempo: getJatuhTempoQuery.error,
    refetchJatuhTempo: getJatuhTempoQuery.refetch,

    // Expose Query Hook for specific ID usage
    getSaldoSiswaQuery,

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
