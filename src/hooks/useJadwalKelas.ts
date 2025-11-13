"use client";

import { api } from "@/trpc/react";
import { toast } from "sonner";

interface useJadwalKelasOptions {
  // Query options
  enableQuery?: boolean;
  // initialData?: [];

  // Mutation callbacks
  onSuccessCreate?: () => void;
  onSuccessUpdate?: () => void;
  onSuccessDelete?: () => void;
}

/**
 * Custom hook untuk mengelola Ruang (Queries + Mutations)
 *
 * @example
 * // Hanya butuh data Ruang
 * const { data: RuangList } = useRuang();
 *
 * // Butuh data + mutations
 * const { data, mutations } = useRuang({
 *   onSuccessCreate: () => console.log("Created!")
 * });
 */
export function useJadwalKelas(options?: useJadwalKelasOptions) {
  const apiUtils = api.useUtils();

  // ========== QUERIES ==========

  // const JamCustomQuery = api.jam.getAllJamCustom.useQuery(undefined, {
  //   enabled: options?.enableQuery ?? true,
  //   initialData: options?.initialDataJamCustom,
  // });

  // ========== MUTATIONS ==========

  // CREATE
  const createMutation = api.jadwalKelas.create.useMutation({
    onSuccess: async () => {
      // Nanti jika ada query getAll, invalidate di sini
      // await apiUtils.jadwalKelas.getAll.invalidate();
      toast.success("Jadwal baru berhasil ditambahkan");
      options?.onSuccessCreate?.();
    },
    onError: (error) => {
      toast.error(`Gagal membuat jadwal: ${error.message}`);
    },
  });

  // UPDATE

  // const updateMutationCustom = api.jam.updateJamCustom.useMutation({
  //   onSuccess: async () => {
  //     await apiUtils.jam.getAllJamCustom.invalidate();
  //     toast.success("Jam berhasil diupdate");
  //     options?.onSuccessUpdate?.();
  //   },
  //   onError: (error) => {
  //     toast.error(`Gagal mengupdate Jam: ${error.message}`);
  //   },
  // });

  // DELETE
  // const deleteMutationCustom = api.jam.deleteJamCustom.useMutation({
  //   onSuccess: async () => {
  //     await apiUtils.jam.getAllJamCustom.invalidate();
  //     toast.success("Jam berhasil dihapus");
  //     options?.onSuccessDelete?.();
  //   },
  //   onError: (error) => {
  //     toast.error(`Gagal menghapus Jam: ${error.message}`);
  //   },
  // });

  return {
    // Query results
    // dataJamTetap: JamTetapQuery.data,
    // isLoadingJamTetap: JamTetapQuery.isLoading,
    // isErrorJamTetap: JamTetapQuery.isError,
    // errorJamTetap: JamTetapQuery.error,

    // Mutations
    mutations: {
      create: {
        mutate: createMutation.mutate,
        mutateAsync: createMutation.mutateAsync,
        isPending: createMutation.isPending,
      },
      // update: {
      //   mutate: updateMutationCustom.mutate,
      //   mutateAsync: updateMutationCustom.mutateAsync,
      //   isPending: updateMutationCustom.isPending,
      // },
      // delete: {
      //   mutate: deleteMutationCustom.mutate,
      //   mutateAsync: deleteMutationCustom.mutateAsync,
      //   isPending: deleteMutationCustom.isPending,
      // },
    },

    // Utils untuk manual invalidation jika perlu
    // refetchCustom: JamCustomQuery.refetch,
    // invalidateTetap: () => apiUtils.jam.getAllJamTetap.invalidate(),
    // invalidateCustom: () => apiUtils.jam.getAllJamCustom.invalidate(),
  };
}
