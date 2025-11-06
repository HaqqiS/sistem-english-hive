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
  const pendaftaranKelasQuery = api.pendaftaranKelas.getAll.useQuery(
    undefined,
    {
      enabled: options?.enableQuery ?? true,
      initialData: options?.initialData,
    },
  );

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
        await apiUtils.pendaftaranKelas.getAll.invalidate();
        await apiUtils.pendaftaranKelas.getPendaftarByKelasId.invalidate();
        await apiUtils.murid.getMuridWhereNotRegistered.invalidate();
        toast.success("Pendaftaran Kelas berhasil ditambahkan");
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
    data: pendaftaranKelasQuery.data,
    isLoading: pendaftaranKelasQuery.isLoading,
    isError: pendaftaranKelasQuery.isError,
    error: pendaftaranKelasQuery.error,

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
    refetch: pendaftaranKelasQuery.refetch,
    invalidate: () => apiUtils.pendaftaranKelas.getAll.invalidate(),
  };
}
