"use client";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import type {
  TypeCreateKelas,
  TypeKelas,
  TypeKelasByGuruId,
  TypeKelasHistory,
} from "@/types/kelas.type";
import { skipToken } from "@tanstack/react-query";

interface UseKelasOptions {
  // Query options
  enableQuery?: boolean;
  initialData?: TypeKelas[];
  initialDataKelasWithSesi?: TypeKelasByGuruId[];
  initialDataHistory?: TypeKelasHistory[];

  // Mutation callbacks
  onSuccessCreate?: (newKelas: TypeCreateKelas) => void;
  onSuccessUpdate?: () => void;
  onSuccessDelete?: () => void;
  onSuccessUpLevel?: () => void;

  // ID untuk query by ID
  kelasId?: string;
  cohortId?: string;
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
export function useKelas(options?: UseKelasOptions) {
  const apiUtils = api.useUtils();

  // ========== QUERIES ==========
  const kelasId = options?.kelasId;
  const cohortId = options?.cohortId;

  const isGetAllEnabled = (options?.enableQuery ?? true) && !kelasId;

  const kelasQuery = api.kelas.getAll.useQuery(undefined, {
    enabled: isGetAllEnabled, // <-- Gunakan logika baru
    initialData: options?.initialData,
  });

  const kelasByIdQuery = api.kelas.getKelasById.useQuery(
    kelasId ? { id: kelasId } : skipToken,
  );

  const kelasWithSesiQuery = api.kelas.getKelasWithSesiForGuru.useQuery(
    undefined,
    {
      initialData: options?.initialDataKelasWithSesi,
    },
  );

  const kelasHistoryQuery = api.kelas.getKelasHistory.useQuery(
    cohortId ? { cohortId: cohortId } : skipToken,
    {
      enabled: !!cohortId,
      initialData: options?.initialDataHistory,
    },
  );
  // ========== MUTATIONS ==========

  // CREATE
  const createMutation = api.kelas.createKelas.useMutation({
    onSuccess: async (newKelas) => {
      await apiUtils.kelas.getAll.invalidate();
      toast.success("Kelas berhasil ditambahkan");
      options?.onSuccessCreate?.(newKelas);
    },
    onError: (error) => {
      toast.error(`Gagal membuat Kelas: ${error.message}`);
    },
  });

  // UPDATE
  const updateMutation = api.kelas.updateKelas.useMutation({
    onSuccess: async () => {
      await apiUtils.kelas.getAll.invalidate();
      toast.success("Kelas berhasil diupdate");
      options?.onSuccessUpdate?.();
    },
    onError: (error) => {
      toast.error(`Gagal mengupdate kelas: ${error.message}`);
    },
  });

  // DELETE
  const deleteMutation = api.kelas.deleteKelas.useMutation({
    onSuccess: async () => {
      await apiUtils.kelas.getAll.invalidate();
      toast.success("Kelas berhasil dihapus");
      options?.onSuccessDelete?.();
    },
    onError: (error) => {
      toast.error(`Gagal menghapus kelas: ${error.message}`);
    },
  });

  // UP LEVEL KELAS
  const upLevelMutation = api.kelas.upLevelKelas.useMutation({
    onSuccess: async () => {
      // Invalidate relevant queries
      await apiUtils.kelas.getAll.invalidate(); // Update list kelas
      await apiUtils.pendaftaranKelas.getAll.invalidate(); // Update status siswa di kelas lama
      // await apiUtils.pembayaran.getAll.invalidate(); // Update data pembayaran (jika ada list pembayaran global)

      toast.success("Kelas berhasil di-uplevel");
      options?.onSuccessUpLevel?.();
    },
    onError: (error) => {
      toast.error(`Gagal menguplevel Kelas: ${error.message}`);
    },
  });

  return {
    data: kelasQuery.data,
    isLoading: kelasQuery.isLoading,
    isError: kelasQuery.isError,
    error: kelasQuery.error,

    dataById: kelasByIdQuery.data,
    isLoadingById: kelasByIdQuery.isLoading,
    isErrorById: kelasByIdQuery.isError,
    errorById: kelasByIdQuery.error,

    dataWithSesi: kelasWithSesiQuery.data,
    isLoadingWithSesi: kelasWithSesiQuery.isLoading,
    isErrorWithSesi: kelasWithSesiQuery.isError,
    errorWithSesi: kelasWithSesiQuery.error,

    dataHistory: kelasHistoryQuery.data,
    isLoadingHistory: kelasHistoryQuery.isLoading,
    isErrorHistory: kelasHistoryQuery.isError,
    errorHistory: kelasHistoryQuery.error,

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
      upLevel: {
        mutate: upLevelMutation.mutate,
        mutateAsync: upLevelMutation.mutateAsync,
        isPending: upLevelMutation.isPending,
      },
    },

    // Utils untuk manual invalidation jika perlu
    refetch: kelasQuery.refetch,
    refetchById: kelasByIdQuery.refetch,
    refetchHistory: kelasHistoryQuery.refetch,
    invalidate: () => apiUtils.kelas.getAll.invalidate(),
  };
}
