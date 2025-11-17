"use client";
import { api } from "@/trpc/react";
import type {
  TypeAbsensiGuru,
  TypeAbsensiGuruHistory,
} from "@/types/absenGuru.type";
import { skipToken } from "@tanstack/react-query";
import { toast } from "sonner";

interface UseGuruOptions {
  // Query options
  enableQuery?: boolean;
  initialDataAbsensi?: TypeAbsensiGuru[];
  initialDataHistory?: TypeAbsensiGuruHistory;

  // Mutation callbacks
  onSuccessCreate?: () => void;
  onSuccessUpdate?: () => void;
  onSuccessUpdateStatus?: () => void;
  onSuccessDelete?: () => void;

  guruId?: string;
  month?: string;
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
export function useAbsenGuru(options?: UseGuruOptions) {
  const apiUtils = api.useUtils();
  const guruId = options?.guruId;
  const month = options?.month;

  // ========== QUERIES ==========

  const getAllAbsensiGuruQuery = api.absenGuru.getAllAbsensi.useQuery(
    undefined,
    {
      enabled: options?.enableQuery ?? true,
      initialData: options?.initialDataAbsensi,
    },
  );

  const getHistoryQuery = api.absenGuru.getHistoryByGuruId.useQuery(
    guruId && month ? { guruId, month } : skipToken, // Hanya jalan jika guruId & month ada
    {
      enabled: !!guruId && !!month,
      initialData: options?.initialDataHistory,
      refetchOnWindowFocus: false,
    },
  );

  // ========== MUTATIONS ==========

  // CREATE
  const createSesiAbsensiMutation =
    api.absenGuru.createSesiAndAbsensi.useMutation({
      onSuccess: async () => {
        await apiUtils.absenGuru.getAllAbsensi.invalidate();
        // await apiUtils.sesiPertemuan..invalidate();
        toast.success("Absensi berhasil ditambahkan");
        options?.onSuccessCreate?.();
      },
      onError: (error) => {
        toast.error(`Gagal membuat Absensi: ${error.message}`);
      },
    });

  // UPDATE
  const updateStatusMutation = api.absenGuru.verifyAbsensi.useMutation({
    onSuccess: async () => {
      await apiUtils.absenGuru.getAllAbsensi.invalidate();
      toast.success("Absensi berhasil diupdate");
      options?.onSuccessUpdateStatus?.();
    },
    onError: (error) => {
      toast.error(`Gagal mengupdate absensi: ${error.message}`);
    },
  });

  const updateAbsensiMutation = api.absenGuru.updateAbsenGuru.useMutation({
    onSuccess: async () => {
      await apiUtils.absenGuru.getAllAbsensi.invalidate();
      toast.success("Absensi berhasil diupdate");
      options?.onSuccessUpdate?.();
    },
    onError: (error) => {
      toast.error(`Gagal mengupdate absensi: ${error.message}`);
    },
  });

  // DELETE
  const deleteMutation = api.absenGuru.deleteAbsenGuru.useMutation({
    onSuccess: async () => {
      await apiUtils.absenGuru.getAllAbsensi.invalidate();
      toast.success("Absensi berhasil dihapus");
      options?.onSuccessDelete?.();
    },
    onError: (error) => {
      toast.error(`Gagal menghapus absensi: ${error.message}`);
    },
  });

  return {
    // Query results

    data: getAllAbsensiGuruQuery.data,
    isLoading: getAllAbsensiGuruQuery.isLoading,
    isError: getAllAbsensiGuruQuery.isError,
    error: getAllAbsensiGuruQuery.error,

    dataHistory: getHistoryQuery.data,
    isLoadingHistory: getHistoryQuery.isLoading,
    isErrorHistory: getHistoryQuery.isError,
    errorHistory: getHistoryQuery.error,

    // Mutations
    mutations: {
      create: {
        mutate: createSesiAbsensiMutation.mutate,
        mutateAsync: createSesiAbsensiMutation.mutateAsync,
        isPending: createSesiAbsensiMutation.isPending,
      },
      updateStatus: {
        mutate: updateStatusMutation.mutate,
        mutateAsync: updateStatusMutation.mutateAsync,
        isPending: updateStatusMutation.isPending,
      },

      update: {
        mutate: updateAbsensiMutation.mutate,
        mutateAsync: updateAbsensiMutation.mutateAsync,
        isPending: updateAbsensiMutation.isPending,
      },
      delete: {
        mutate: deleteMutation.mutate,
        mutateAsync: deleteMutation.mutateAsync,
        isPending: deleteMutation.isPending,
      },
    },

    // Utils untuk manual invalidation jika perlu
    refetch: getAllAbsensiGuruQuery.refetch,
    refetchHistory: getHistoryQuery.refetch,
    invalidate: () => apiUtils.absenGuru.getAllAbsensi.invalidate(),
    invalidateHistory: () =>
      guruId && month
        ? apiUtils.absenGuru.getHistoryByGuruId.invalidate({ guruId, month })
        : undefined,
  };
}
