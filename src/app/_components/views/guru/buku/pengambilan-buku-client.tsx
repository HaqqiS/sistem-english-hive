"use client";

import { BookOpen, CheckCircle2, Clock, Package } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";

function formatDate(date: Date | string | null | undefined) {
	if (!date) return null;
	return new Date(date).toLocaleDateString("id-ID", {
		day: "numeric",
		month: "long",
		year: "numeric",
	});
}

export function PengambilanBukuSection() {
	const utils = api.useUtils();

	const { data: penerimaList, isLoading } =
		api.stokBuku.getPenerimaForGuru.useQuery();

	const updateStatus = api.stokBuku.updateStatusPenerima.useMutation({
		onSuccess: async () => {
			await utils.stokBuku.getPenerimaForGuru.invalidate();
		},
		onError: (err) => toast.error(err.message ?? "Gagal memperbarui status"),
	});

	if (isLoading) {
		return (
			<div className="space-y-3">
				{Array.from({ length: 2 }, (_, i) => i).map((id) => (
					<Skeleton key={id} className="h-20 w-full rounded-lg" />
				))}
			</div>
		);
	}

	// Kalau tidak ada, tidak render sama sekali (hidden)
	if (!penerimaList || penerimaList.length === 0) return null;

	// Group by kelas
	const grouped: Record<string, typeof penerimaList> = {};
	for (const p of penerimaList) {
		const key = p.kelas?.kodeKelas ?? "Tanpa Kelas";
		if (!grouped[key]) grouped[key] = [];
		grouped[key].push(p);
	}

	return (
		<div className="space-y-4">
			<div className="flex items-center gap-3">
				<div className="bg-primary/10 rounded-xl p-2.5">
					<Package className="text-primary h-5 w-5" />
				</div>
				<div>
					<h2 className="text-lg font-bold">Pengambilan Buku</h2>
					<p className="text-muted-foreground text-sm">
						Buku siap diambil oleh siswa di kelas Anda.
					</p>
				</div>
			</div>

			{Object.entries(grouped).map(([kodeKelas, items]) => (
				<Card key={kodeKelas}>
					<CardHeader className="pb-3">
						<div className="flex items-center gap-2">
							<BookOpen className="text-primary h-4 w-4" />
							<CardTitle className="text-base">{kodeKelas}</CardTitle>
							<Badge variant="secondary" className="text-xs">
								{items.filter((i) => i.status === "SUDAH_DIAMBIL").length}/
								{items.length} diambil
							</Badge>
						</div>
						{items[0]?.stokBuku.tanggalReady && (
							<CardDescription className="text-xs">
								Ready sejak: {formatDate(items[0].stokBuku.tanggalReady)}
							</CardDescription>
						)}
					</CardHeader>
					<CardContent className="space-y-2">
						{items.map((p) => {
							const sudahDiambil = p.status === "SUDAH_DIAMBIL";
							return (
								<div
									key={p.id}
									className={cn(
										"flex items-center justify-between rounded-md border p-3",
										sudahDiambil &&
											"border-green-200 bg-green-50/50 dark:border-green-900/50 dark:bg-green-950/20",
									)}
								>
									<div>
										<p className="text-sm font-medium">{p.murid.namaLengkap}</p>
										<div className="text-muted-foreground flex items-center gap-2 text-xs">
											<span>{p.stokBuku.jenisKelas.nama}</span>
											{p.murid.kelasSekolah && (
												<span>· {p.murid.kelasSekolah}</span>
											)}
										</div>
									</div>
									<Button
										size="sm"
										variant={sudahDiambil ? "default" : "outline"}
										className={cn(
											"h-8 text-xs",
											sudahDiambil && "bg-green-600 hover:bg-green-700",
										)}
										onClick={() =>
											updateStatus.mutate({
												penerimaBukuId: p.id,
												status: sudahDiambil
													? "BELUM_DIAMBIL"
													: "SUDAH_DIAMBIL",
											})
										}
										disabled={updateStatus.isPending}
									>
										{sudahDiambil ? (
											<>
												<CheckCircle2 className="mr-1 h-3.5 w-3.5" />
												Sudah Diambil
											</>
										) : (
											<>
												<Clock className="mr-1 h-3.5 w-3.5" />
												Belum Diambil
											</>
										)}
									</Button>
								</div>
							);
						})}
					</CardContent>
				</Card>
			))}
		</div>
	);
}
