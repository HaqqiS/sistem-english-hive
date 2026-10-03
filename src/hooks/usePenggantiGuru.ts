"use client";
import { toast } from "sonner";
import { api } from "@/trpc/react";
import type { TypeBuatTokenPenggantiOutput } from "@/types/absenGuru.type";

interface UsePenggantiGuruOptions {
	/** Aktifkan fetch daftar guru (untuk dropdown pilih pengganti di sisi guru asli) */
	enableDaftarGuru?: boolean;
	onSuccessBuatToken?: (data: TypeBuatTokenPenggantiOutput) => void;
}

/**
 * Hook alur guru pengganti (kode 8 digit, tanpa database).
 *
 * Sisi guru asli : daftarGuru + mutations.buatToken -> hasilnya berisi `kodeFormat`
 *                  (mis. "4821 0937") untuk dikirim ke guru pengganti.
 * Sisi pengganti : tidak butuh hook ini. Kode dikirim sebagai `tokenPengganti`
 *                  lewat startSesi dari useAbsenGuru; server yang memvalidasi.
 */
export function usePenggantiGuru(options?: UsePenggantiGuruOptions) {
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

	return {
		daftarGuru: daftarGuruQuery.data ?? [],
		isLoadingDaftarGuru: daftarGuruQuery.isLoading,

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
