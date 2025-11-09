"use client";

import { api } from "@/trpc/react";
import type { TypeMuridNotRegistered } from "@/types/murid.type";
import { toast } from "sonner";

interface useMuridOptions {
  // Query options
  enableQuery?: boolean;
  initialData?: TypeMuridNotRegistered[];

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
export function useMurid(options?: useMuridOptions) {
  const apiUtils = api.useUtils();

  // ========== QUERIES ==========
  const MuridNotRegisteredQuery = api.murid.getMuridWhereNotRegistered.useQuery(
    undefined,
    {
      enabled: options?.enableQuery ?? true,
      initialData: options?.initialData,
    },
  );

  // const MuridQuery = api.murid.getAll.useQuery(undefined, {
  //   enabled: options?.enableQuery ?? true,
  //   initialData: options?.initialData,
  // });

  // ========== MUTATIONS ==========

  // CREATE
  const createMutation = api.murid.registerMurid.useMutation({
    onSuccess: async () => {
      await apiUtils.ruang.getRuangByCabangId.invalidate();
      toast.success("Murid berhasil didaftarkan");
      options?.onSuccessCreate?.();
    },
    onError: (error) => {
      toast.error(`Gagal mendaftar Murid: ${error.message}`);
    },
  });

  // UPDATE

  const updateStatusMuridMutation = api.murid.updateStatusMurid.useMutation({
    onSuccess: async () => {
      await apiUtils.murid.getMuridWhereNotRegistered.invalidate();
      toast.success("Status Murid berhasil diupdate");
      options?.onSuccessUpdate?.();
    },
    onError: (error) => {
      toast.error(`Gagal mengupdate Status Murid: ${error.message}`);
    },
  });
  // const updateMutation = api.ruang.updateRuang.useMutation({
  //   onSuccess: async () => {
  //     await apiUtils.ruang.getAll.invalidate();
  //     toast.success("Ruang berhasil diupdate");
  //     options?.onSuccessUpdate?.();
  //   },
  //   onError: (error) => {
  //     toast.error(`Gagal mengupdate Ruang: ${error.message}`);
  //   },
  // });

  // DELETE
  // const deleteMutation = api.ruang.deleteRuang.useMutation({
  //   onSuccess: async () => {
  //     await apiUtils.ruang.getAll.invalidate();
  //     toast.success("Ruang berhasil dihapus");
  //     options?.onSuccessDelete?.();
  //   },
  //   onError: (error) => {
  //     toast.error(`Gagal menghapus Ruang: ${error.message}`);
  //   },
  // });

  return {
    // Query results
    dataMuridNotRegistered: MuridNotRegisteredQuery.data,
    isLoadingMuridNotRegistered: MuridNotRegisteredQuery.isLoading,
    isErrorMuridNotRegistered: MuridNotRegisteredQuery.isError,
    errorMuridNotRegistered: MuridNotRegisteredQuery.error,

    // Mutations
    mutations: {
      create: {
        mutate: createMutation.mutate,
        mutateAsync: createMutation.mutateAsync,
        isPending: createMutation.isPending,
      },
      update: {
        mutate: updateStatusMuridMutation.mutate,
        mutateAsync: updateStatusMuridMutation.mutateAsync,
        isPending: updateStatusMuridMutation.isPending,
      },
      // delete: {
      //   mutate: deleteMutation.mutate,
      //   mutateAsync: deleteMutation.mutateAsync,
      //   isPending: deleteMutation.isPending,
      // },
    },

    // Utils untuk manual invalidation jika perlu
    // refetch: MuridNotRegisteredQuery.refetch,
    // invalidate: () => apiUtils.murid.getMuridWhereNotRegistered.invalidate(),
  };
}
