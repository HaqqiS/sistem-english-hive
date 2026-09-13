"use client";

import type { StatusKelas, TipeKelas } from "@prisma/client";
import { GraduationCap, Search } from "lucide-react";
import { useMemo, useState } from "react";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
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
import { Skeleton } from "@/components/ui/skeleton";
import { useJenisKelas } from "@/hooks/useJenisKelas";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";
import { formatStatus, statusKelasColorMap } from "@/utils/statusUtils";
import { toRupiah } from "@/utils/toRupiah";
import RingkasanTagihanKelas from "./ringkasan-tagihan-kelas";

export default function PilihKelasPembayaran() {
	const [search, setSearch] = useState("");
	const [tipeFilter, setTipeFilter] = useState<TipeKelas | "ALL">("ALL");
	const [jenisFilter, setJenisFilter] = useState<string | "ALL">("ALL");
	const [levelFilter, setLevelFilter] = useState<number | "ALL">("ALL");
	const [statusFilter, setStatusFilter] = useState<StatusKelas | "ALL">(
		"RUNNING",
	);

	// Accordion terbuka (bisa lebih dari satu, seperti di tab Kelas).
	// Detail pembayaran per kelas baru di-fetch saat kartunya dibuka (lazy).
	const [openItems, setOpenItems] = useState<string[]>([]);

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
				<div className="space-y-4 pt-4">
					{Array.from({ length: 3 }, (_, i) => i).map((id) => (
						<Skeleton key={id} className="h-24 w-full rounded-lg" />
					))}
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
										<SubGroupLabel label="Reguler" count={REGULAR.length} />
										<Accordion
											type="multiple"
											value={openItems}
											onValueChange={setOpenItems}
											className="flex w-full flex-col gap-3"
										>
											{REGULAR.map((kelas) => (
												<KelasPembayaranCard
													key={kelas.id}
													kelas={kelas}
													isOpen={openItems.includes(kelas.id)}
												/>
											))}
										</Accordion>
									</div>
								)}

								{PRIVATE.length > 0 && (
									<div className="rounded-xl bg-purple-50/60 p-4 dark:bg-purple-950/20">
										<SubGroupLabel label="Private" count={PRIVATE.length} />
										<Accordion
											type="multiple"
											value={openItems}
											onValueChange={setOpenItems}
											className="flex w-full flex-col gap-3"
										>
											{PRIVATE.map((kelas) => (
												<KelasPembayaranCard
													key={kelas.id}
													kelas={kelas}
													isOpen={openItems.includes(kelas.id)}
												/>
											))}
										</Accordion>
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

// ── Sub-group label (Reguler / Private) — sama seperti tab Kelas ────────────
function SubGroupLabel({ label, count }: { label: string; count: number }) {
	const isPrivate = label.toLowerCase() === "private";
	return (
		<div className="mb-2 flex items-center gap-2">
			<span
				className={cn(
					"rounded-md px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-widest text-white",
					isPrivate ? "bg-purple-500" : "bg-blue-500",
				)}
			>
				{label}
			</span>
			<span className="text-muted-foreground/60 text-[11px]">({count})</span>
		</div>
	);
}

function KelasPembayaranCard({
	kelas,
	isOpen,
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
	isOpen: boolean;
}) {
	return (
		<Card className="py-0">
			<CardContent className="p-0">
				<AccordionItem value={kelas.id} className="border-none">
					<AccordionTrigger className="hover:bg-muted/30 items-center px-6 py-5 transition-colors hover:no-underline">
						<div className="flex w-full flex-col gap-4">
							{/* Header: Kode & Badges */}
							<div className="flex w-full flex-col justify-between gap-2 sm:flex-row sm:items-center">
								<span className="text-foreground text-lg font-bold tracking-tight">
									{kelas.kodeKelas}
								</span>
								<div className="flex flex-wrap items-center justify-end gap-2">
									<Badge
										variant="secondary"
										className="flex gap-1.5 px-2.5 py-1"
									>
										<GraduationCap className="h-3.5 w-3.5" />
										<span>{kelas.jumlahSiswa}</span>
									</Badge>
									<Badge
										className={statusKelasColorMap[kelas.statusKelas] ?? ""}
										variant="outline"
									>
										{formatStatus(kelas.statusKelas)}
									</Badge>
								</div>
							</div>

							{/* Metadata */}
							<div className="text-muted-foreground flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-xs">
								<span>
									{kelas.jenisKelasNama} - Level {kelas.level}
								</span>
								{kelas.totalBelumLunas > 0 ? (
									<span className="text-sm font-semibold text-red-600">
										{toRupiah(kelas.totalBelumLunas)} belum lunas
									</span>
								) : (
									<span className="text-xs">Semua Lunas</span>
								)}
							</div>
						</div>
					</AccordionTrigger>

					<AccordionContent className="bg-muted/5 border-t px-6 py-5 data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
						{isOpen && <RingkasanTagihanKelas kelasId={kelas.id} />}
					</AccordionContent>
				</AccordionItem>
			</CardContent>
		</Card>
	);
}
