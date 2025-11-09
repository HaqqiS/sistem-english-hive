"use client";
import { api } from "@/trpc/react";
import type { TypeAbsensiGuru } from "@/types/absenGuru.type";
import { toast } from "sonner";

interface UseGuruOptions {
  // Query options
  enableQuery?: boolean;
  initialDataAbsensi?: TypeAbsensiGuru[];

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
export function useAbsenGuru(options?: UseGuruOptions) {
  const apiUtils = api.useUtils();

  // ========== QUERIES ==========

  const getAllAbsensiGuruQuery = api.absenGuru.getAllAbsensi.useQuery(
    undefined,
    {
      enabled: options?.enableQuery ?? true,
      initialData: options?.initialDataAbsensi,
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
      options?.onSuccessUpdate?.();
    },
    onError: (error) => {
      toast.error(`Gagal mengupdate absensi: ${error.message}`);
    },
  });

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

    data: getAllAbsensiGuruQuery.data,
    isLoading: getAllAbsensiGuruQuery.isLoading,
    isError: getAllAbsensiGuruQuery.isError,
    error: getAllAbsensiGuruQuery.error,

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
      // delete: {
      //   mutate: deleteMutation.mutate,
      //   mutateAsync: deleteMutation.mutateAsync,
      //   isPending: deleteMutation.isPending,
      // },
    },

    // Utils untuk manual invalidation jika perlu
    refetch: getAllAbsensiGuruQuery.refetch,
    invalidate: () => apiUtils.absenGuru.getAllAbsensi.invalidate(),
  };
}
