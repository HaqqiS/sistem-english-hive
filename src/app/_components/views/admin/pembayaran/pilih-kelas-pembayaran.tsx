"use client";

import type { StatusKelas, TipeKelas } from "@prisma/client";
import { Loader2, Receipt, Search, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useJenisKelas } from "@/hooks/useJenisKelas";
import { api } from "@/trpc/react";
import { formatStatus, statusKelasColorMap } from "@/utils/statusUtils";
import { toRupiah } from "@/utils/toRupiah";

interface PilihKelasPembayaranProps {
	onSelect: (kelasId: string) => void;
}

export default function PilihKelasPembayaran({
	onSelect,
}: PilihKelasPembayaranProps) {
	const [search, setSearch] = useState("");
	const [tipeFilter, setTipeFilter] = useState<TipeKelas | "ALL">("ALL");
	const [jenisFilter, setJenisFilter] = useState<string | "ALL">("ALL");
	const [levelFilter, setLevelFilter] = useState<number | "ALL">("ALL");
	const [statusFilter, setStatusFilter] = useState<StatusKelas | "ALL">(
		"RUNNING",
	);

	const { data: jenisKelasList } = useJenisKelas();
	const { data, isLoading } = api.pembayaran.getRingkasanSemuaKelas.useQuery(
		{},
	);

	const filtered = useMemo(() => {
		if (!data) return [];
		return data.filter((kelas) => {
			const matchSearch =
				search.trim() === "" ||
				kelas.kodeKelas.toLowerCase().includes(search.toLowerCase()) ||
				kelas.jenisKelasNama.toLowerCase().includes(search.toLowerCase());
			const matchTipe = tipeFilter === "ALL" || kelas.tipe === tipeFilter;
			const matchJenis =
				jenisFilter === "ALL" || kelas.jenisKelasNama === jenisFilter;
			const matchLevel = levelFilter === "ALL" || kelas.level === levelFilter;
			const matchStatus =
				statusFilter === "ALL" || kelas.statusKelas === statusFilter;
			return (
				matchSearch && matchTipe && matchJenis && matchLevel && matchStatus
			);
		});
	}, [data, search, tipeFilter, jenisFilter, levelFilter, statusFilter]);

	// Sort: huruf kode kelas dulu, lalu angka level (1A sebelum 2A)
	const sorted = useMemo(() => {
		return [...filtered].sort((a, b) => {
			const letterA = a.kodeKelas.replace(/[^a-zA-Z]/g, "").toUpperCase();
			const letterB = b.kodeKelas.replace(/[^a-zA-Z]/g, "").toUpperCase();
			if (letterA !== letterB) return letterA.localeCompare(letterB);
			return a.kodeKelas.localeCompare(b.kodeKelas, undefined, {
				numeric: true,
				sensitivity: "base",
			});
		});
	}, [filtered]);

	// Group by jenisKelas -> sub by tipe (REGULAR/PRIVATE), sama seperti di
	// halaman admin > kelas
	type KelasItem = (typeof sorted)[number];
	const groups = useMemo(() => {
		const groupMap = new Map<
			string,
			{ REGULAR: KelasItem[]; PRIVATE: KelasItem[] }
		>();
		for (const kelas of sorted) {
			const jenisNama = kelas.jenisKelasNama;
			if (!groupMap.has(jenisNama))
				groupMap.set(jenisNama, { REGULAR: [], PRIVATE: [] });
			const group = groupMap.get(jenisNama);
			if (group) {
				if (kelas.tipe === "PRIVATE") {
					group.PRIVATE.push(kelas);
				} else {
					group.REGULAR.push(kelas);
				}
			}
		}
		return [...groupMap.entries()].sort(([a], [b]) => a.localeCompare(b));
	}, [sorted]);

	return (
		<div className="space-y-4">
			<div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
				<div className="relative flex-1 sm:min-w-[220px]">
					<Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
					<Input
						placeholder="Cari kode kelas / jenis kelas..."
						className="pl-9"
						value={search}
						onChange={(e) => setSearch(e.target.value)}
					/>
				</div>
				<Select
					value={tipeFilter}
					onValueChange={(v) => setTipeFilter(v as TipeKelas | "ALL")}
				>
					<SelectTrigger className="w-full sm:w-[140px]">
						<SelectValue placeholder="Tipe Kelas" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="ALL">Semua Tipe</SelectItem>
						<SelectItem value="REGULAR">Reguler</SelectItem>
						<SelectItem value="PRIVATE">Private</SelectItem>
					</SelectContent>
				</Select>
				<Select value={jenisFilter} onValueChange={(v) => setJenisFilter(v)}>
					<SelectTrigger className="w-full sm:w-[170px]">
						<SelectValue placeholder="Jenis Kelas" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="ALL">Semua Jenis Kelas</SelectItem>
						{jenisKelasList?.map((jk) => (
							<SelectItem key={jk.id} value={jk.nama}>
								{jk.nama}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				<Select
					value={String(levelFilter)}
					onValueChange={(v) => setLevelFilter(v === "ALL" ? "ALL" : Number(v))}
				>
					<SelectTrigger className="w-full sm:w-[120px]">
						<SelectValue placeholder="Level" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="ALL">Semua Level</SelectItem>
						{[1, 2, 3, 4].map((lvl) => (
							<SelectItem key={lvl} value={String(lvl)}>
								Level {lvl}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				<Select
					value={statusFilter}
					onValueChange={(v) => setStatusFilter(v as StatusKelas | "ALL")}
				>
					<SelectTrigger className="w-full sm:w-[150px]">
						<SelectValue placeholder="Status" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="ALL">Semua Status</SelectItem>
						<SelectItem value="RUNNING">Running</SelectItem>
						<SelectItem value="WAITING">Waiting</SelectItem>
						<SelectItem value="TRIAL">Trial</SelectItem>
						<SelectItem value="LEVEL_UP">Level Up</SelectItem>
					</SelectContent>
				</Select>
			</div>

			{isLoading ? (
				<div className="flex items-center justify-center py-12">
					<Loader2 className="h-6 w-6 animate-spin" />
				</div>
			) : groups.length === 0 ? (
				<p className="text-muted-foreground py-8 text-center text-sm">
					Tidak ada kelas yang cocok dengan pencarian/filter.
				</p>
			) : (
				<div className="space-y-8 pt-2">
					{groups.map(([jenisNama, { REGULAR, PRIVATE }]) => (
						<div key={jenisNama}>
							<div className="mb-4 flex items-center gap-3">
								<span className="bg-primary/10 text-primary rounded-md px-3 py-1 text-sm font-bold tracking-wider uppercase">
									{jenisNama}
								</span>
								<span className="text-muted-foreground text-xs">
									{REGULAR.length + PRIVATE.length} kelas
								</span>
								<div className="bg-border h-px flex-1" />
							</div>

							<div className="space-y-4 pl-1">
								{REGULAR.length > 0 && (
									<div className="rounded-xl bg-blue-50/60 p-4 dark:bg-blue-950/20">
										<p className="text-muted-foreground mb-3 text-xs font-semibold uppercase">
											Reguler ({REGULAR.length})
										</p>
										<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
											{REGULAR.map((kelas) => (
												<KelasPembayaranCard
													key={kelas.id}
													kelas={kelas}
													onSelect={onSelect}
												/>
											))}
										</div>
									</div>
								)}

								{PRIVATE.length > 0 && (
									<div className="rounded-xl bg-purple-50/60 p-4 dark:bg-purple-950/20">
										<p className="text-muted-foreground mb-3 text-xs font-semibold uppercase">
											Private ({PRIVATE.length})
										</p>
										<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
											{PRIVATE.map((kelas) => (
												<KelasPembayaranCard
													key={kelas.id}
													kelas={kelas}
													onSelect={onSelect}
												/>
											))}
										</div>
									</div>
								)}
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
}

function KelasPembayaranCard({
	kelas,
	onSelect,
}: {
	kelas: {
		id: string;
		kodeKelas: string;
		jenisKelasNama: string;
		level: number;
		statusKelas: StatusKelas;
		jumlahSiswa: number;
		totalBelumLunas: number;
	};
	onSelect: (kelasId: string) => void;
}) {
	return (
		<button
			type="button"
			onClick={() => onSelect(kelas.id)}
			className="text-left"
		>
			<Card className="hover:border-primary/60 h-full cursor-pointer bg-white transition-colors hover:shadow-sm dark:bg-background">
				<CardContent className="space-y-3 p-4">
					<div className="flex items-start justify-between gap-2">
						<div className="flex items-center gap-2">
							<div className="bg-primary/10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full">
								<Receipt className="text-primary h-4 w-4" />
							</div>
							<div>
								<p className="font-semibold leading-tight">{kelas.kodeKelas}</p>
								<p className="text-muted-foreground text-xs">
									{kelas.jenisKelasNama} - Level {kelas.level}
								</p>
							</div>
						</div>
						<Badge
							className={statusKelasColorMap[kelas.statusKelas] ?? ""}
							variant="outline"
						>
							{formatStatus(kelas.statusKelas)}
						</Badge>
					</div>

					<div className="flex items-center justify-between border-t pt-3 text-sm">
						<div className="text-muted-foreground flex items-center gap-1">
							<Users className="h-3.5 w-3.5" />
							{kelas.jumlahSiswa} siswa
						</div>
						{kelas.totalBelumLunas > 0 ? (
							<span className="font-semibold text-red-600">
								{toRupiah(kelas.totalBelumLunas)}
							</span>
						) : (
							<span className="text-muted-foreground text-xs">Semua Lunas</span>
						)}
					</div>
				</CardContent>
			</Card>
		</button>
	);
}
