"use client";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import type {
  SesiPertemuanType,
  TypeSesiSummary,
} from "@/types/sesiPertemuan.type";
import { skipToken } from "@tanstack/react-query";

interface UseSesiPertemuanOptions {
  // Query options
  enableQuery?: boolean;
  initialData?: SesiPertemuanType[];
  initialDataSummary?: TypeSesiSummary;

  // Mutation callbacks
  onSuccessCreate?: () => void;
  onSuccessUpdate?: () => void;
  onSuccessDelete?: () => void;

  kelasId?: string;
  filterCabang?: string;
}

export function useSesiPertemuan(options?: UseSesiPertemuanOptions) {
  const apiUtils = api.useUtils();
  const kelasId = options?.kelasId;
  const cabangIdPayload =
    options?.filterCabang !== "ALL" ? options?.filterCabang : undefined;

  // ========== QUERIES ==========
  const sesiPertemuanQuery = api.sesiPertemuan.getAll.useQuery(
    { cabangId: cabangIdPayload },
    {
      enabled: options?.enableQuery ?? true,
      initialData: options?.initialData,
    },
  );

  const sesiSummaryQuery = api.sesiPertemuan.getSesiSummaryByKelasId.useQuery(
    kelasId ? { kelasId: kelasId } : skipToken, // Gunakan skipToken jika kelasId belum siap
    {
      enabled: options?.enableQuery ?? !!kelasId, // Aktifkan hanya jika kelasId ada
      initialData: options?.initialDataSummary,
      refetchOnWindowFocus: false,
    },
  );

  const invalidateSesi = async () => {
    await Promise.all([
      apiUtils.sesiPertemuan.getAll.invalidate({ cabangId: cabangIdPayload }),
      apiUtils.sesiPertemuan.getSesiSummaryByKelasId.invalidate(),
      // Jika sesi terkait pembayaran (jumlah pertemuan), refresh pembayaran juga
      apiUtils.pembayaran.getAllPaginated.invalidate(),
    ]);
  };

  // ========== MUTATIONS ==========

  // CREATE
  const createMutation = api.sesiPertemuan.createSesiPertemuan.useMutation({
    onSuccess: async () => {
      await invalidateSesi();
      toast.success("Program Kelas berhasil ditambahkan");
      options?.onSuccessCreate?.();
    },
    onError: (error) => {
      toast.error(`Gagal membuat Program Kelas: ${error.message}`);
    },
  });

  // UPDATE
  // const updateMutation = api.cabang.updateCabang.useMutation({
  //   onSuccess: async () => {
  //     await apiUtils.cabang.getAll.invalidate();
  //     toast.success("Cabang berhasil diupdate");
  //     options?.onSuccessUpdate?.();
  //   },
  //   onError: (error) => {
  //     toast.error(`Gagal mengupdate cabang: ${error.message}`);
  //   },
  // });

  // DELETE
  // const deleteMutation = api.cabang.deleteCabang.useMutation({
  //   onSuccess: async () => {
  //     await apiUtils.cabang.getAll.invalidate();
  //     toast.success("Cabang berhasil dihapus");
  //     options?.onSuccessDelete?.();
  //   },
  //   onError: (error) => {
  //     toast.error(`Gagal menghapus cabang: ${error.message}`);
  //   },
  // });

  return {
    // Query results
    dataSesiPertemuan: {
      data: sesiPertemuanQuery.data,
      isLoading: sesiPertemuanQuery.isLoading,
      isError: sesiPertemuanQuery.isError,
      error: sesiPertemuanQuery.error,
    },

    dataSummary: sesiSummaryQuery.data,
    isLoadingSummary: sesiSummaryQuery.isLoading,
    isErrorSummary: sesiSummaryQuery.isError,
    errorSummary: sesiSummaryQuery.error,

    // Mutations
    mutations: {
      create: {
        mutate: createMutation.mutate,
        mutateAsync: createMutation.mutateAsync,
        isPending: createMutation.isPending,
      },
      // update: {
      //   mutate: updateMutation.mutate,
      //   mutateAsync: updateMutation.mutateAsync,
      //   isPending: updateMutation.isPending,
      // },
      // delete: {
      //   mutate: deleteMutation.mutate,
      //   mutateAsync: deleteMutation.mutateAsync,
      //   isPending: deleteMutation.isPending,
      // },
    },

    // Utils untuk manual invalidation jika perlu
    refetch: sesiPertemuanQuery.refetch,
    refetchSummary: sesiSummaryQuery.refetch,
    invalidate: invalidateSesi,
  };
}
