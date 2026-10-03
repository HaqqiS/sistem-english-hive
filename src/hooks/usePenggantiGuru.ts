"use client";
import { toast } from "sonner";
import { api } from "@/trpc/react";
import type {
	TypeBuatTokenPenggantiOutput,
	TypeCekTokenPenggantiOutput,
} from "@/types/absenGuru.type";

interface UsePenggantiGuruOptions {
	/** Aktifkan fetch daftar guru (untuk dropdown pilih pengganti di sisi guru asli) */
	enableDaftarGuru?: boolean;
	onSuccessBuatToken?: (data: TypeBuatTokenPenggantiOutput) => void;
}

/**
 * Hook alur guru pengganti (berbasis kode/token, tanpa database).
 *
 * Sisi guru asli  : daftarGuru + mutations.buatToken
 * Sisi pengganti  : cekToken(kode) -> lalu panggil startSesi dari useAbsenGuru
 *                   dengan { jadwalKelasId, status, tokenPengganti: kode }.
 *                   Jika hasil cekToken.sudahDipakai === true, arahkan langsung
 *                   ke /guru/absen/{sesiId} (tidak perlu startSesi lagi).
 */
export function usePenggantiGuru(options?: UsePenggantiGuruOptions) {
	const apiUtils = api.useUtils();

	const daftarGuruQuery = api.absenGuru.getDaftarGuruPengganti.useQuery(
		undefined,
		{
			enabled: options?.enableDaftarGuru ?? false,
			refetchOnWindowFocus: false,
		},
	);

	const buatTokenMutation = api.absenGuru.buatTokenPengganti.useMutation({
		onSuccess: (data) => {
			toast.success("Kode pengganti berhasil dibuat");
			options?.onSuccessBuatToken?.(data);
		},
		onError: (error) => {
			toast.error(`Gagal membuat kode pengganti: ${error.message}`);
		},
	});

	/** Memeriksa kode. Mengembalikan null (dan menampilkan toast) jika tidak valid. */
	const cekToken = async (
		token: string,
	): Promise<TypeCekTokenPenggantiOutput | null> => {
		try {
			return await apiUtils.absenGuru.cekTokenPengganti.fetch(
				{ token },
				{ staleTime: 0 },
			);
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Kode pengganti tidak valid",
			);
			return null;
		}
	};

	return {
		daftarGuru: daftarGuruQuery.data ?? [],
		isLoadingDaftarGuru: daftarGuruQuery.isLoading,

		cekToken,

		mutations: {
			buatToken: {
				mutate: buatTokenMutation.mutate,
				mutateAsync: buatTokenMutation.mutateAsync,
				isPending: buatTokenMutation.isPending,
				data: buatTokenMutation.data,
			},
		},
	};
}
