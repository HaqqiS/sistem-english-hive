"use client";

import type { KategoriTagihan } from "@prisma/client";
import { BookOpen, IdCard, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/trpc/react";

interface TambahTagihanCepatProps {
	muridId: string;
	kelasId: string;
	namaLengkap: string;
	kategori: Extract<KategoriTagihan, "BUKU" | "REGISTRASI">;
	onSuccess?: () => void | Promise<void>;
}

// Tagihan Buku/Registrasi disambungkan langsung ke tabel TagihanLain yang
// sudah ada (kategori BUKU/REGISTRASI) — tidak ada perubahan skema database.
const KATEGORI_CONFIG = {
	BUKU: {
		icon: BookOpen,
		label: "Tagihan Buku",
		judulDefault: "Buku",
		tooltip: "Tambah Tagihan Buku",
		colorClass: "border-blue-200 text-blue-600 hover:bg-blue-50",
	},
	REGISTRASI: {
		icon: IdCard,
		label: "Tagihan Registrasi",
		judulDefault: "Biaya Registrasi",
		tooltip: "Tambah Tagihan Registrasi",
		colorClass: "border-purple-200 text-purple-600 hover:bg-purple-50",
	},
} as const;

export default function TambahTagihanCepat({
	muridId,
	kelasId,
	namaLengkap,
	kategori,
	onSuccess,
}: TambahTagihanCepatProps) {
	const [open, setOpen] = useState(false);
	const [judul, setJudul] = useState<string>(
		KATEGORI_CONFIG[kategori].judulDefault,
	);
	const [jumlah, setJumlah] = useState("");

	const config = KATEGORI_CONFIG[kategori];
	const Icon = config.icon;

	const createMutation = api.tagihanLain.create.useMutation({
		onSuccess: async () => {
			toast.success(
				`${config.label} untuk ${namaLengkap} berhasil ditambahkan`,
			);
			setOpen(false);
			setJudul(config.judulDefault);
			setJumlah("");
			await onSuccess?.();
		},
		onError: (err) => {
			toast.error(err.message || "Gagal menambahkan tagihan");
		},
	});

	const handleSubmit = () => {
		const jumlahNum = Number(jumlah);
		if (!judul.trim() || !jumlahNum || jumlahNum <= 0) {
			toast.error("Judul & jumlah tagihan harus diisi dengan benar");
			return;
		}

		createMutation.mutate({
			muridId,
			kelasId,
			kategori,
			judul: judul.trim(),
			jumlah: jumlahNum,
		});
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button
					variant="outline"
					size="icon"
					className={`h-8 w-8 ${config.colorClass}`}
					title={config.tooltip}
				>
					<Icon className="h-4 w-4" />
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{config.tooltip}</DialogTitle>
					<DialogDescription>
						Tambahkan {config.label.toLowerCase()} untuk {namaLengkap}.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4 py-2">
					<div className="space-y-2">
						<Label htmlFor="judul">Judul Tagihan</Label>
						<Input
							id="judul"
							value={judul}
							onChange={(e) => setJudul(e.target.value)}
							placeholder={config.judulDefault}
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="jumlah">Jumlah (Rp)</Label>
						<Input
							id="jumlah"
							type="number"
							value={jumlah}
							onChange={(e) => setJumlah(e.target.value)}
							placeholder="50000"
						/>
					</div>
				</div>

				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => setOpen(false)}
						disabled={createMutation.isPending}
					>
						Batal
					</Button>
					<Button onClick={handleSubmit} disabled={createMutation.isPending}>
						{createMutation.isPending && (
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						)}
						Simpan
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
