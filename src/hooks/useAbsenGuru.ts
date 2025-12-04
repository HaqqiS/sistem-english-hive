"use client";
import { api } from "@/trpc/react";
import type {
  TypeAbsensiGuruHistory,
  TypeAbsensiGuruPaginated,
} from "@/types/absenGuru.type";
import { keepPreviousData, skipToken } from "@tanstack/react-query";
import type { PaginationState } from "@tanstack/react-table";
import { toast } from "sonner";

interface UseGuruOptions {
  // Query options
  enableQuery?: boolean;
  initialDataAbsensi?: TypeAbsensiGuruPaginated;
  initialDataHistory?: TypeAbsensiGuruHistory;

  // Mutation callbacks
  onSuccessCreate?: () => void;
  onSuccessStartSesi?: (newSesiId: string, isFinished: boolean) => void;
  onSuccessUpdate?: () => void;
  onSuccessUpdateStatus?: () => void;
  onSuccessDelete?: () => void;

  guruId?: string;
  month?: string;
  pagination?: PaginationState;
  searchFilter?: string;
}

export function useAbsenGuru(options?: UseGuruOptions) {
  const apiUtils = api.useUtils();
  const pageIndex = options?.pagination?.pageIndex ?? 0;
  const pageSize = options?.pagination?.pageSize ?? 10;
  const guruId = options?.guruId;
  const month = options?.month;
  const searchFilter = options?.searchFilter;

  // ========== QUERIES ==========

  const getAllAbsensiGuruQuery = api.absenGuru.getAllAbsensi.useQuery(
    { pageIndex, pageSize, search: searchFilter, month },
    {
      enabled: !!options?.pagination,
      initialData: options?.initialDataAbsensi,
      placeholderData: keepPreviousData,
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

  const fetchExportData = async () => {
    return await apiUtils.absenGuru.getForExport.fetch({
      search: searchFilter,
      month,
    });
  };

  const fetchHistoryExport = async () => {
    if (!guruId || !month) return [];

    // Menggunakan fetch() dari router yang sudah ada (getHistoryByGuruId)
    return await apiUtils.absenGuru.getHistoryByGuruId.fetch({
      guruId,
      month,
    });
  };

  // ========== MUTATIONS ==========

  // CREATE
  const createSesiAbsensiMutation =
    api.absenGuru.createSesiAndAbsensi.useMutation({
      onSuccess: async (data) => {
        await apiUtils.absenGuru.getAllAbsensi.invalidate();
        await apiUtils.jadwalKelas.getJadwalHariIniForGuru.invalidate();
        // await apiUtils.sesiPertemuan..invalidate();
        if (data.isFinished) {
          toast.success(
            "Selamat! Kelas ini telah menyelesaikan semua pertemuan (Lulus Level).",
          );
        } else {
          toast.success("Sesi berhasil dimulai!");
        }
        if (options?.onSuccessStartSesi) {
          options.onSuccessStartSesi(data.newSesiId, data.isFinished);
        }
        options?.onSuccessCreate?.();
      },
      onError: (error) => {
        toast.error(`Gagal membuat Absensi: ${error.message}`);
      },
    });

  const startSesiMutation = api.absenGuru.createSesiAndAbsensi.useMutation({
    onSuccess: async (data) => {
      // Penting: Refresh jadwal di dashboard agar tombol berubah jadi "Lanjut Sesi"
      await apiUtils.jadwalKelas.getJadwalHariIniForGuru.invalidate();
      await apiUtils.absenGuru.getAllAbsensi.invalidate();

      if (data.isFinished) {
        toast.success(
          "Selamat! Kelas ini telah menyelesaikan semua pertemuan (Lulus Level).",
        );
      } else {
        toast.success("Sesi berhasil dimulai!");
      }

      // Teruskan status isFinished ke komponen UI
      if (options?.onSuccessStartSesi) {
        options.onSuccessStartSesi(data.newSesiId, data.isFinished);
      }
      options?.onSuccessCreate?.();
    },
    onError: (error) => {
      toast.error(`Gagal memulai sesi: ${error.message}`);
    },
  });

  // UPDATE
  const updateStatusMutation = api.absenGuru.verifyAbsensi.useMutation({
    onSuccess: async () => {
      await apiUtils.absenGuru.getAllAbsensi.invalidate();
      toast.success("Status verifikasi berhasil diupdate");
      options?.onSuccessUpdateStatus?.();
    },
    onError: (error) => {
      toast.error(`Gagal verifikasi absensi: ${error.message}`);
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

    data: getAllAbsensiGuruQuery.data?.data ?? [],
    pageCount: getAllAbsensiGuruQuery.data?.pageCount ?? 0,
    totalRows: getAllAbsensiGuruQuery.data?.total ?? 0,
    isLoading: getAllAbsensiGuruQuery.isLoading,
    isFetching: getAllAbsensiGuruQuery.isFetching,
    isError: getAllAbsensiGuruQuery.isError,
    error: getAllAbsensiGuruQuery.error,

    dataHistory: getHistoryQuery.data,
    isLoadingHistory: getHistoryQuery.isLoading,
    isErrorHistory: getHistoryQuery.isError,
    isFetchingHistory: getHistoryQuery.isFetching,
    errorHistory: getHistoryQuery.error,

    fetchExportData,
    fetchHistoryExport,

    // Mutations
    mutations: {
      create: {
        mutate: createSesiAbsensiMutation.mutate,
        mutateAsync: createSesiAbsensiMutation.mutateAsync,
        isPending: createSesiAbsensiMutation.isPending,
      },
      startSesi: startSesiMutation,
      updateStatus: updateStatusMutation,
      update: updateAbsensiMutation,
      delete: deleteMutation,
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
