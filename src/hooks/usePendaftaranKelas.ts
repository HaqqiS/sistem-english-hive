"use client";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import type { PendaftaranKelasType } from "@/types/pendaftaranKelas.type";
import { skipToken } from "@tanstack/react-query";

interface UseProgramKelasOptions {
  // Query options
  enableQuery?: boolean;
  initialData?: PendaftaranKelasType[];
  kelasId?: string;

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
export function usePendaftaranKelas(options?: UseProgramKelasOptions) {
  const apiUtils = api.useUtils();

  // ========== QUERIES ==========
  const daftarMuridByKelasIdQuery =
    api.pendaftaranKelas.getPendaftarByKelasId.useQuery(
      options?.kelasId ? { kelasId: options.kelasId } : skipToken,
      {
        enabled: options?.enableQuery && !!options?.kelasId,
      },
    );

  // ========== MUTATIONS ==========

  // CREATE
  const createMutation =
    api.pendaftaranKelas.createPendaftaranKelas.useMutation({
      onSuccess: async () => {
        await apiUtils.pendaftaranKelas.getPendaftarByKelasId.invalidate();
        await apiUtils.murid.getMuridWhereNotRegistered.invalidate();
        await apiUtils.kelas.getKelasAndCount.invalidate();
        toast.success("Pendaftaran Kelas berhasil ditambahkan");
        options?.onSuccessCreate?.();
      },
      onError: (error) => {
        toast.error(`Gagal membuat Program Kelas: ${error.message}`);
      },
    });

  const createBulkMutation =
    api.pendaftaranKelas.createBulkPendaftaranKelas.useMutation({
      onSuccess: async (data) => {
        await apiUtils.pendaftaranKelas.getPendaftarByKelasId.invalidate();
        await apiUtils.murid.getMuridWhereNotRegistered.invalidate();
        await apiUtils.kelas.getKelasAndCount.invalidate();
        toast.success(`Berhasil mendaftarkan ${data.count} murid ke kelas.`);
        options?.onSuccessCreate?.();
      },
      onError: (error) => {
        toast.error(`Gagal pendaftaran massal: ${error.message}`);
      },
    });

  // UPDATE
  const updateMutation =
    api.pendaftaranKelas.updatePendaftaranKelas.useMutation({
      onSuccess: async () => {
        await apiUtils.pendaftaranKelas.getPendaftarByKelasId.invalidate();
        await apiUtils.murid.getMuridWhereNotRegistered.invalidate();
        await apiUtils.kelas.getKelasAndCount.invalidate();
        toast.success("Pendaftaran Kelas berhasil diupdate");
        options?.onSuccessUpdate?.();
      },
      onError: (error) => {
        toast.error(`Gagal mengupdate Pendaftaran Kelas: ${error.message}`);
      },
    });

  // DELETE
  const deleteMutation =
    api.pendaftaranKelas.deletePendaftaranKelas.useMutation({
      onSuccess: async () => {
        await apiUtils.pendaftaranKelas.getPendaftarByKelasId.invalidate();
        await apiUtils.murid.getMuridWhereNotRegistered.invalidate();
        await apiUtils.kelas.getKelasAndCount.invalidate();
        toast.success("Murid berhasil dihapus dari Kelas");
        options?.onSuccessDelete?.();
      },
      onError: (error) => {
        toast.error(`Gagal menghapus Murid dari Kelas: ${error.message}`);
      },
    });

  return {
    // Query results

    dataByKelasId: daftarMuridByKelasIdQuery.data,
    isLoadingByKelasId: daftarMuridByKelasIdQuery.isLoading,
    isErrorByKelasId: daftarMuridByKelasIdQuery.isError,
    errorByKelasId: daftarMuridByKelasIdQuery.error,

    // Mutations
    mutations: {
      create: {
        mutate: createMutation.mutate,
        mutateAsync: createMutation.mutateAsync,
        isPending: createMutation.isPending,
      },
      createBulk: {
        mutate: createBulkMutation.mutate,
        mutateAsync: createBulkMutation.mutateAsync,
        isPending: createBulkMutation.isPending,
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
    refetch: daftarMuridByKelasIdQuery.refetch,
    invalidate: () =>
      apiUtils.pendaftaranKelas.getPendaftarByKelasId.invalidate(),
  };
}
