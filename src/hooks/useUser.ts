"use client";
import { api } from "@/trpc/react";
import type { TypeGuru } from "@/types/user.type";
import { toast } from "sonner";

interface UseGuruOptions {
  // Query options
  enableQuery?: boolean;
  initialDataGuru?: TypeGuru[];

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
export function useUser(options?: UseGuruOptions) {
  const apiUtils = api.useUtils();

  // ========== QUERIES ==========
  const getAllGuruQuery = api.user.getAllGuru.useQuery(undefined, {
    enabled: options?.enableQuery ?? true,
    initialData: options?.initialDataGuru,
  });

  // ========== MUTATIONS ==========

  // CREATE
  // const createAbsensiMutation = api.guru.createAbsensi.useMutation({
  //   onSuccess: async () => {
  //     await apiUtils.guru.getAllAbsensi.invalidate();
  //     await apiUtils.jadwalSesi.notUsedJadwalSesi.invalidate();
  //     toast.success("Absensi berhasil ditambahkan");
  //     options?.onSuccessCreate?.();
  //   },
  //   onError: (error) => {
  //     toast.error(`Gagal membuat Absensi: ${error.message}`);
  //   },
  // });

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
    data: getAllGuruQuery.data,
    isLoading: getAllGuruQuery.isLoading,
    isError: getAllGuruQuery.isError,
    error: getAllGuruQuery.error,

    // Mutations
    // mutations: {
    //   create: {
    //     mutate: createAbsensiMutation.mutate,
    //     mutateAsync: createAbsensiMutation.mutateAsync,
    //     isPending: createAbsensiMutation.isPending,
    //   },
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

    // Utils untuk manual invalidation jika perlu
    refetchGuru: getAllGuruQuery.refetch,
    invalidateGuru: () => apiUtils.user.getAllGuru.invalidate(),
  };
}
