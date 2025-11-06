"use client";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import type { CreateKelasType, KelasType } from "@/types/kelas.type";
import { skipToken } from "@tanstack/react-query";

interface UseKelasOptions {
  // Query options
  enableQuery?: boolean;
  initialData?: KelasType[];

  // Mutation callbacks
  onSuccessCreate?: (newKelas: CreateKelasType) => void;
  onSuccessUpdate?: () => void;
  onSuccessDelete?: () => void;

  // ID untuk query by ID
  kelasId?: string;
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
  const isGetAllEnabled = (options?.enableQuery ?? true) && !kelasId;

  const kelasQuery = api.kelas.getAll.useQuery(undefined, {
    enabled: isGetAllEnabled, // <-- Gunakan logika baru
    initialData: options?.initialData,
  });

  const kelasByIdQuery = api.kelas.getKelasById.useQuery(
    kelasId ? { id: kelasId } : skipToken,
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

  return {
    data: kelasQuery.data,
    isLoading: kelasQuery.isLoading,
    isError: kelasQuery.isError,
    error: kelasQuery.error,

    dataById: kelasByIdQuery.data,
    isLoadingById: kelasByIdQuery.isLoading,
    isErrorById: kelasByIdQuery.isError,
    errorById: kelasByIdQuery.error,

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
    refetch: kelasQuery.refetch,
    refetchById: kelasByIdQuery.refetch,
    invalidate: () => apiUtils.kelas.getAll.invalidate(),
  };
}
