"use client";

import { Bell, BellOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/trpc/react";
import { toRupiah } from "@/utils/toRupiah";

interface StatusDiingatkanBadgeProps {
	id: string;
	jenis: "SPP" | "BUKU" | "REGISTRASI";
	label: string;
	jumlah: number;
	sudahDiingatkan: boolean;
	onToggled?: () => void | Promise<void>;
}

export default function StatusDiingatkanBadge({
	id,
	jenis,
	label,
	jumlah,
	sudahDiingatkan,
	onToggled,
}: StatusDiingatkanBadgeProps) {
	const toggleSpp = api.pembayaran.toggleDiingatkan.useMutation();
	const toggleTagihanLain = api.tagihanLain.toggleDiingatkan.useMutation();

	const isPending = toggleSpp.isPending || toggleTagihanLain.isPending;

	const handleToggle = async () => {
		const nextValue = !sudahDiingatkan;
		try {
			if (jenis === "SPP") {
				await toggleSpp.mutateAsync({ id, value: nextValue });
			} else {
				await toggleTagihanLain.mutateAsync({ id, value: nextValue });
			}
			toast.success(
				nextValue ? "Ditandai sudah diingatkan" : "Ditandai belum diingatkan",
			);
			await onToggled?.();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Gagal mengubah status");
		}
	};

	return (
		<button
			type="button"
			onClick={handleToggle}
			disabled={isPending}
			title={
				sudahDiingatkan
					? "Sudah diingatkan via WA — klik untuk batalkan"
					: "Belum diingatkan — klik untuk tandai sudah diingatkan"
			}
			className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium transition-colors disabled:opacity-60 ${
				sudahDiingatkan
					? "border-green-300 bg-green-50 text-green-700 hover:bg-green-100"
					: "border-red-300 bg-red-50 text-red-700 hover:bg-red-100"
			}`}
		>
			{isPending ? (
				<Loader2 className="h-3 w-3 animate-spin" />
			) : sudahDiingatkan ? (
				<Bell className="h-3 w-3" />
			) : (
				<BellOff className="h-3 w-3" />
			)}
			{label}: {toRupiah(jumlah)}
		</button>
	);
}
