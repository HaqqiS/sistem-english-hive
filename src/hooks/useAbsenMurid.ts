"use client";
import type { StatusAbsenMurid } from "@prisma/client";
import { skipToken } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/trpc/react";
import type { MuridForAbsensi, SesiAbsensiInfo } from "@/types/absenMurid.type";

// Definisikan options untuk hook
interface UseAbsenMuridOptions {
	// Query options
	enableQuery?: boolean;
	sesiId?: string;
	initialDataMuridList?: MuridForAbsensi[];
	initialDataSesiInfo?: SesiAbsensiInfo;

	// Mutation callbacks
	onSuccessCreateOrUpdate?: (
		namaMurid: string,
		status: StatusAbsenMurid,
	) => void;
	onErrorCreateOrUpdate?: (error: unknown) => void;
}

/**
 * Custom hook untuk mengelola absensi murid.
 * Mengambil daftar murid untuk sesi tertentu dan menangani update absensi.
 */
export function useAbsenMurid(options?: UseAbsenMuridOptions) {
	const apiUtils = api.useUtils();
	const sesiId = options?.sesiId;

	// ========== QUERIES ==========

	// Query untuk mengambil daftar murid dan info sesi untuk absensi
	const getMuridForAbsensiQuery = api.absenMurid.getMuridForAbsensi.useQuery(
		sesiId ? { sesiId: sesiId } : skipToken, // Gunakan skipToken jika sesiId belum ada
		{
			enabled: options?.enableQuery ?? !!sesiId, // Aktifkan jika sesiId ada
			initialData:
				options?.initialDataMuridList && options.initialDataSesiInfo
					? {
							muridList: options.initialDataMuridList,
							sesiInfo: options.initialDataSesiInfo,
						}
					: undefined,
			refetchOnWindowFocus: false,
		},
	);

	const invalidateAbsensi = async () => {
		// Refresh data absensi murid di sesi ini
		await apiUtils.absenMurid.getMuridForAbsensi.invalidate(
			sesiId ? { sesiId } : undefined,
		);
		// Refresh juga data summary sesi di kelas (jika ada hook useSesiPertemuan aktif)
		await apiUtils.sesiPertemuan.getSesiSummaryByKelasId.invalidate();
		// Refresh pembayaran karena absen bisa trigger auto-bill
		await apiUtils.pembayaran.getAllPaginated.invalidate();
		// PENTING: Refresh jadwal hari ini untuk Dashboard Guru agar status berubah (Mulai -> Selesai)
		await apiUtils.jadwalKelas.getJadwalHariIniForGuru.invalidate();
		// Refresh juga list absensi guru global
		await apiUtils.absenGuru.getAllAbsensi.invalidate();
	};

	// ========== MUTATIONS ==========

	// Mutasi untuk membuat atau memperbarui absensi seorang murid
	const createOrUpdateAbsensiMutation =
		api.absenMurid.createOrUpdateAbsensi.useMutation({
			onSuccess: (_data, variables) => {
				// Invalidate query agar data di tabel ter-refresh
				void apiUtils.absenMurid.getMuridForAbsensi.invalidate({
					sesiId: variables.sesiId,
				});

				// Panggil callback sukses jika ada
				if (options?.onSuccessCreateOrUpdate) {
					// Kita tidak punya nama murid di sini, jadi kita cari di data cache
					const cachedData = getMuridForAbsensiQuery.data;
					const namaMurid =
						cachedData?.muridList.find((m) => m.muridId === variables.muridId)
							?.namaLengkap ?? "Siswa";
					options.onSuccessCreateOrUpdate(namaMurid, variables.status);
				} else {
					// Fallback toast jika tidak ada callback
					toast.success(`Absensi disimpan sebagai ${variables.status}`);
				}
			},
			onError: (error) => {
				if (options?.onErrorCreateOrUpdate) {
					options.onErrorCreateOrUpdate(error);
				} else {
					toast.error(`Gagal menyimpan absensi: ${error.message}`);
				}
			},
		});

	const selesaiAbsenMutation = api.absenMurid.selesaikanAbsen.useMutation({
		onSuccess: async () => {
			await invalidateAbsensi();
		},
		onError: (error) => {
			toast.error(`Gagal menyelesaikan sesi absensi: ${error.message}`);
		},
	});

	return {
		// Query results
		data: getMuridForAbsensiQuery.data,
		isLoading: getMuridForAbsensiQuery.isLoading,
		isError: getMuridForAbsensiQuery.isError,
		error: getMuridForAbsensiQuery.error,

		// Mutations
		mutations: {
			createOrUpdate: createOrUpdateAbsensiMutation,
			selesaikanAbsen: selesaiAbsenMutation,
		},

		// Utils untuk manual invalidation jika perlu
		refetch: getMuridForAbsensiQuery.refetch,
		invalidate: invalidateAbsensi,
	};
}
