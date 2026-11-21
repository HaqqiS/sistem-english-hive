"use client";

import type { MetodeBayar } from "@prisma/client";
import { Banknote, Landmark, Loader2, QrCode } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { METODE_BAYAR_OPTIONS } from "@/constants/pembayaran";
import { cn } from "@/lib/utils";
import dayjs, { TIMEZONE_BISNIS } from "@/utils/dateUtils";
import { toRupiah } from "@/utils/toRupiah";

export type LunaskanItem = {
	id: string;
	/** Teks yang ditampilkan, mis. "Budi - SPP Ke-2". */
	label: string;
	/** Nominal tagihan penuh (tidak dikurangi diskon). */
	jumlah: number;
};

export type LunaskanResult = {
	metodeBayar: MetodeBayar;
	/** YYYY-MM-DD */
	tanggalBayar: string;
	/** Diskon per id tagihan. Tagihan tanpa diskon bernilai 0. */
	diskonById: Record<string, number>;
};

interface LunaskanDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	items: LunaskanItem[];
	onConfirm: (result: LunaskanResult) => void | Promise<void>;
	isPending?: boolean;
	title?: string;
	/**
	 * Info siswa yang ditampilkan SEKALI di atas daftar tagihan, tersusun ke
	 * bawah (label di atas, nilai di bawahnya). Dipakai saat semua item milik
	 * satu siswa, supaya label item tidak perlu mengulang nama.
	 */
	subjek?: { label: string; value: string }[];
}

const METODE_ICON = {
	CASH: Banknote,
	TRANSFER: Landmark,
	QRIS: QrCode,
} as const;

const hariIni = () => dayjs().tz(TIMEZONE_BISNIS).format("YYYY-MM-DD");

/**
 * Dialog pelunasan: pilih metode (Cash / Transfer / QRIS), tanggal pelunasan,
 * dan diskon per tagihan. Diskon HANYA dicatat; tidak mengurangi nominal tagihan.
 * Dialog tidak menutup sendiri — penutupan diatur pemanggil setelah mutasi sukses.
 */
export function LunaskanDialog({
	open,
	onOpenChange,
	items,
	onConfirm,
	isPending = false,
	title = "Lunaskan Pembayaran",
	subjek,
}: LunaskanDialogProps) {
	const baseId = useId();
	const [metode, setMetode] = useState<MetodeBayar | "">("");
	const [tanggal, setTanggal] = useState("");
	const [diskon, setDiskon] = useState<Record<string, string>>({});

	// Reset setiap kali dialog dibuka
	useEffect(() => {
		if (open) {
			setMetode("");
			setTanggal("");
			setDiskon({});
		}
	}, [open]);

	const diskonError = (item: LunaskanItem): string | null => {
		const raw = diskon[item.id];
		if (raw === undefined || raw === "") return null;
		const n = Number(raw);
		if (!Number.isInteger(n) || n < 0) return "Diskon harus bilangan bulat ≥ 0";
		if (n > item.jumlah) return "Diskon melebihi nominal tagihan";
		return null;
	};

	const adaError = items.some((i) => diskonError(i) !== null);
	const bisaSubmit = metode !== "" && tanggal !== "" && !adaError && !isPending;

	const handleSubmit = () => {
		if (metode === "" || !bisaSubmit) return;
		const diskonById: Record<string, number> = {};
		for (const item of items) {
			const raw = diskon[item.id];
			diskonById[item.id] = raw ? Number(raw) : 0;
		}
		void onConfirm({ metodeBayar: metode, tanggalBayar: tanggal, diskonById });
	};

	const totalTagihan = items.reduce((a, b) => a + b.jumlah, 0);

	return (
		<Dialog open={open} onOpenChange={(o) => !isPending && onOpenChange(o)}>
			<DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					<DialogDescription>
						{items.length > 1
							? `${items.length} tagihan akan dilunaskan dengan metode dan tanggal yang sama.`
							: "Pilih metode pembayaran dan tanggal pelunasan."}
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-5">
					{subjek && subjek.length > 0 && (
						<div className="bg-muted/60 space-y-2 rounded-lg px-3 py-2.5">
							{subjek.map((row) => (
								<div key={row.label}>
									<p className="text-muted-foreground text-xs leading-tight">
										{row.label}
									</p>
									<p className="font-semibold leading-snug">{row.value}</p>
								</div>
							))}
						</div>
					)}

					{/* Metode */}
					<div className="space-y-2">
						<Label>Metode Pembayaran</Label>
						<RadioGroup
							value={metode}
							onValueChange={(v) => setMetode(v as MetodeBayar)}
							className="grid grid-cols-3 gap-2"
						>
							{METODE_BAYAR_OPTIONS.map((opt) => {
								const Icon = METODE_ICON[opt.value];
								const id = `${baseId}-${opt.value}`;
								const aktif = metode === opt.value;
								return (
									<Label
										key={opt.value}
										htmlFor={id}
										className={cn(
											"flex cursor-pointer flex-col items-center gap-1.5 rounded-lg border p-3 text-sm font-medium transition-colors",
											aktif
												? "border-primary bg-primary/10 text-primary"
												: "hover:bg-muted",
										)}
									>
										<RadioGroupItem
											id={id}
											value={opt.value}
											className="sr-only"
										/>
										<Icon className="h-5 w-5" />
										{opt.label}
									</Label>
								);
							})}
						</RadioGroup>
					</div>

					{/* Tanggal */}
					<div className="space-y-2">
						<Label htmlFor={`${baseId}-tanggal`}>
							Tanggal Pelunasan <span className="text-destructive">*</span>
						</Label>
						<Input
							id={`${baseId}-tanggal`}
							type="date"
							value={tanggal}
							max={hariIni()}
							onChange={(e) => setTanggal(e.target.value)}
						/>
					</div>

					{/* Diskon per tagihan */}
					<div className="space-y-3">
						<div>
							<Label>Diskon (opsional)</Label>
							<p className="text-muted-foreground text-xs">
								Hanya dicatat untuk laporan, tidak mengurangi nominal tagihan.
							</p>
						</div>
						<div className="max-h-56 space-y-3 overflow-y-auto pr-1">
							{items.map((item) => {
								const err = diskonError(item);
								return (
									<div key={item.id} className="space-y-1.5">
										<div className="flex items-start justify-between gap-2 text-sm">
											<span className="font-medium">{item.label}</span>
											<span className="text-muted-foreground shrink-0">
												{toRupiah(item.jumlah)}
											</span>
										</div>
										<CurrencyInput
											placeholder="Diskon (Rp), kosongkan jika tidak ada"
											value={diskon[item.id] ?? ""}
											aria-invalid={err !== null}
											onValueChange={(v) =>
												setDiskon((prev) => ({
													...prev,
													[item.id]: v === undefined ? "" : String(v),
												}))
											}
										/>
										{err && <p className="text-destructive text-xs">{err}</p>}
									</div>
								);
							})}
						</div>
					</div>

					{items.length > 1 && (
						<div className="bg-muted flex items-center justify-between rounded-md px-3 py-2 text-sm">
							<span>Total tagihan</span>
							<span className="font-semibold">{toRupiah(totalTagihan)}</span>
						</div>
					)}
				</div>

				<DialogFooter className="gap-2 sm:gap-0">
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
						disabled={isPending}
					>
						Batal
					</Button>
					<Button onClick={handleSubmit} disabled={!bisaSubmit}>
						{isPending ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Memproses...
							</>
						) : (
							"Lunaskan"
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
