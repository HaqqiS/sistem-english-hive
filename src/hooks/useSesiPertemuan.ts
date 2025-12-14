"use client";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import type { TypeSesiSummary } from "@/types/sesiPertemuan.type";
import { skipToken } from "@tanstack/react-query";

interface UseSesiPertemuanOptions {
  // Query options
  enableQuery?: boolean;
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
      apiUtils.sesiPertemuan.getSesiSummaryByKelasId.invalidate({
        kelasId: kelasId,
      }),
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

  // DELETE

  return {
    // Query results

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
    },

    // Utils untuk manual invalidation jika perlu
    refetchSummary: sesiSummaryQuery.refetch,
    invalidate: invalidateSesi,
  };
}
