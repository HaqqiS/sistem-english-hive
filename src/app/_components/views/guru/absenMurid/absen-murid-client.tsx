"use client";

import {
	CalendarDays,
	ChevronRight,
	GraduationCap,
	School,
	Search,
	Users,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useKelas } from "@/hooks/useKelas";
import { useGlobalCabangStore } from "@/store/useGlobalCabangStore";
import { formatToWITA } from "@/utils/dateUtils";

export default function AbsenMuridClient() {
	const [search, setSearch] = useState("");
	const { activeCabangId } = useGlobalCabangStore();
	const { dataWithSesi: dataKelas, isLoadingWithSesi } = useKelas({
		enableQueryGetKelasWithSesi: true,
		filterCabang: activeCabangId,
	});

	if (isLoadingWithSesi) {
		return (
			<div className="space-y-4">
				{Array.from({ length: 3 }, (_, k) => k).map((k) => (
					<Card key={k} className="overflow-hidden">
						<CardContent className="p-0">
							{/* Mimic Accordion Trigger */}
							<div className="flex items-center justify-between px-6 py-4">
								<div className="flex flex-1 items-center justify-between pr-4">
									<div className="flex items-center gap-3">
										{/* Icon */}
										<Skeleton className="h-10 w-10 rounded-lg" />
										<div className="flex flex-col gap-2">
											<Skeleton className="h-5 w-32" /> {/* Kode Kelas */}
											<Skeleton className="h-4 w-24" /> {/* Nama Guru */}
										</div>
									</div>
									<Skeleton className="h-6 w-16 rounded-full" /> {/* Badge */}
								</div>
							</div>
						</CardContent>
					</Card>
				))}
			</div>
		);
	}

	// 2. Empty State
	if (!dataKelas || dataKelas.length === 0) {
		return (
			<Card className="border-dashed">
				<CardContent className="flex flex-col items-center justify-center py-12 text-center">
					<div className="bg-muted mb-4 flex h-12 w-12 items-center justify-center rounded-full">
						<School className="text-muted-foreground h-6 w-6" />
					</div>
					<h3 className="text-lg font-semibold">Belum ada Kelas</h3>
					<p className="text-muted-foreground mt-1 max-w-sm text-sm">
						Anda belum memiliki kelas yang aktif atau belum ada sesi pertemuan
						yang dijadwalkan.
					</p>
				</CardContent>
			</Card>
		);
	}
	const kelasTampil = dataKelas.filter((k) =>
		k.kodeKelas.toLowerCase().includes(search.trim().toLowerCase()),
	);

	return (
		<div className="space-y-3">
			{dataKelas.length > 4 && (
				<div className="relative">
					<Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
					<Input
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						placeholder="Cari kelas..."
						className="h-11 pl-9"
					/>
				</div>
			)}

			{kelasTampil.length === 0 ? (
				<p className="text-muted-foreground py-10 text-center text-sm">
					Kelas tidak ditemukan.
				</p>
			) : (
				<div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
					{kelasTampil.map((kelas) => {
						const totalSesi = kelas.sesiPertemuanKelases.length;
						const sesiTerakhir = kelas.sesiPertemuanKelases[0];

						return (
							<Link
								key={kelas.id}
								href={`/guru/absen/rekap/${kelas.id}`}
								className="bg-card active:bg-muted/60 hover:bg-muted/30 flex items-center gap-3 rounded-2xl border p-4 shadow-sm transition-colors"
							>
								<div className="bg-primary/10 text-primary flex size-11 shrink-0 items-center justify-center rounded-xl">
									<Users className="h-5 w-5" />
								</div>

								<div className="min-w-0 flex-1 space-y-1.5">
									<p className="text-sm leading-snug font-semibold break-words">
										{kelas.kodeKelas}
									</p>
									<div className="text-muted-foreground flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs">
										<GraduationCap className="h-3.5 w-3.5 shrink-0" />
										{kelas.historyGuruKelases.length > 0 ? (
											kelas.historyGuruKelases.map((h) => (
												<span key={h.id} className="flex items-center gap-1">
													{h.guru.name}
													{h.peran === "ASISTING" && (
														<Badge
															variant="secondary"
															className="h-4 px-1.5 text-[10px]"
														>
															Asisting
														</Badge>
													)}
												</span>
											))
										) : (
											<span>Belum Ditugaskan</span>
										)}
									</div>
									<div className="flex flex-wrap items-center gap-x-3 gap-y-1">
										<Badge
											variant="secondary"
											className="h-6 rounded-full px-2.5 text-[11px] font-semibold"
										>
											{totalSesi} Pertemuan
										</Badge>
										{sesiTerakhir && (
											<span className="text-muted-foreground flex items-center gap-1 text-[11px]">
												<CalendarDays className="h-3 w-3" />
												Terakhir{" "}
												{formatToWITA(sesiTerakhir.tanggalWaktu, "D MMM YYYY")}
											</span>
										)}
									</div>
								</div>

								<ChevronRight className="text-muted-foreground h-5 w-5 shrink-0" />
							</Link>
						);
					})}
				</div>
			)}
		</div>
	);
}
