"use client";

import { api } from "@/trpc/react";
import type {
  TypeJadwalHariIni,
  TypeJadwalKelas,
} from "@/types/jadwalKelas.type";
import { Hari } from "@prisma/client";
import { toast } from "sonner";

interface useJadwalKelasOptions {
  // Query options
  enableQueryAll?: boolean;
  enableQueryHariIni?: boolean;
  enableQueryMatrix?: boolean;

  initialData?: TypeJadwalKelas[];
  initialDataJadwalHariIni?: TypeJadwalHariIni;

  // Mutation callbacks
  onSuccessCreate?: () => void;
  onSuccessUpdate?: () => void;
  onSuccessDelete?: () => void;

  cabangId?: string;
  hari?: Hari;
  guruId?: string;
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

  const jadwalHariIniQuery = api.jadwalKelas.getJadwalHariIniForGuru.useQuery(
    { guruId: options?.guruId }, // Kirim guruId ke backend (bisa undefined)
    {
      enabled: options?.enableQueryHariIni ?? true,
      initialData: options?.initialDataJadwalHariIni,
      refetchOnWindowFocus: true, // Agar realtime jika ada perubahan
    },
  );

  const getAllJadwal = api.jadwalKelas.getAll.useQuery(undefined, {
    enabled: options?.enableQueryAll ?? false,
    initialData: options?.initialData,
  });

  const getScheduleMatrix = api.jadwalKelas.getScheduleMatrix.useQuery(
    {
      cabangId: options?.cabangId ?? "",
      hari: options?.hari ?? Hari.SENIN,
    },
    {
      // Hanya jalankan jika flag enable nyala DAN cabangId sudah terpilih
      enabled: (options?.enableQueryMatrix ?? false) && !!options?.cabangId,
      refetchOnWindowFocus: false, // Tidak perlu refetch agresif untuk matrix besar
    },
  );

  // ========== MUTATIONS ==========

  // CREATE
  const createMutation = api.jadwalKelas.create.useMutation({
    onSuccess: async () => {
      // Nanti jika ada query getAll, invalidate di sini
      await apiUtils.jadwalKelas.getAll.invalidate();
      await apiUtils.jadwalKelas.getScheduleMatrix.invalidate({
        cabangId: options?.cabangId,
        hari: options?.hari,
      });
      await apiUtils.jadwalKelas.getJadwalHariIniForGuru.invalidate();
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
  const deleteMutationCustom = api.jadwalKelas.delete.useMutation({
    onSuccess: async () => {
      await apiUtils.jadwalKelas.getAll.invalidate();
      await apiUtils.jadwalKelas.getScheduleMatrix.invalidate({
        cabangId: options?.cabangId,
        hari: options?.hari,
      });
      await apiUtils.jadwalKelas.getJadwalHariIniForGuru.invalidate();

      toast.success("Jadwal berhasil dihapus");
      options?.onSuccessDelete?.();
    },
    onError: (error) => {
      toast.error(`Gagal menghapus Jadwal: ${error.message}`);
    },
  });

  return {
    // Query results
    dataJadwalHariIni: jadwalHariIniQuery.data,
    isLoadingJadwalHariIni: jadwalHariIniQuery.isLoading,
    isErrorJadwalHariIni: jadwalHariIniQuery.isError,
    errorJadwalHariIni: jadwalHariIniQuery.error,
    refetchJadwalHariIni: jadwalHariIniQuery.refetch,

    dataJadwal: getAllJadwal.data,
    isLoadingDataJadwal: getAllJadwal.isLoading,
    isErrorDataJadwal: getAllJadwal.isError,
    errorDataJadwal: getAllJadwal.error,

    dataMatrix: getScheduleMatrix.data,
    isLoadingMatrix: getScheduleMatrix.isLoading,
    isErrorMatrix: getScheduleMatrix.isError,
    errorMatrix: getScheduleMatrix.error,
    refetchMatrix: getScheduleMatrix.refetch,

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
      delete: {
        mutate: deleteMutationCustom.mutate,
        mutateAsync: deleteMutationCustom.mutateAsync,
        isPending: deleteMutationCustom.isPending,
      },
    },

    // Utils untuk manual invalidation jika perlu
    // refetchCustom: JamCustomQuery.refetch,
    // invalidateTetap: () => apiUtils.jam.getAllJamTetap.invalidate(),
    // invalidateCustom: () => apiUtils.jam.getAllJamCustom.invalidate(),
  };
}
