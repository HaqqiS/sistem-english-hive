"use client";

import { StatusPendaftaran } from "@prisma/client";
import {
	Album,
	ArrowRight,
	CalendarClock,
	CalendarDays,
	Edit2,
	EllipsisVertical,
	GraduationCap,
	Trash,
	TrendingUp,
	User,
} from "lucide-react";
import Link from "next/link";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import type { TypeKelasWithSesiPertemuanCount } from "@/types/kelas.type";
import { formatToWITA } from "@/utils/dateUtils";
import { toRupiah } from "@/utils/toRupiah";

interface KelasListViewProps {
	data?: TypeKelasWithSesiPertemuanCount[];
	isLoading: boolean;
	onEditKelas: (item: TypeKelasWithSesiPertemuanCount) => void;
	onEditGuruKelas: (item: TypeKelasWithSesiPertemuanCount) => void;
	onUpLevel: (item: TypeKelasWithSesiPertemuanCount) => void;
	onDelete: (item: TypeKelasWithSesiPertemuanCount) => void;
	emptyMessage?: string;
}

export function KelasListView({
	data,
	isLoading,
	onEditKelas,
	onEditGuruKelas,
	onUpLevel,
	onDelete,
	emptyMessage = "Belum ada kelas.",
}: KelasListViewProps) {
	if (isLoading) {
		return (
			<div className="space-y-4 pt-4">
				{Array.from({ length: 3 }, (_, i) => i).map((id) => (
					<Skeleton key={id} className="h-24 w-full rounded-lg" />
				))}
			</div>
		);
	}

	return (
		<Accordion
			type="multiple"
			className="grid w-full grid-cols-1 items-start gap-4 md:grid-cols-2"
		>
			{data && data.length > 0 ? (
				data.map((kelas) => {
					const guruAktif =
						kelas.historyGuruKelases.length > 0
							? kelas.historyGuruKelases.map((h) => h.guru.name).join(" & ")
							: "Belum ada guru";
					const lastSession = kelas.sesiPertemuanKelases[0]?.tanggalWaktu;
					const jadwalHari =
						kelas.jadwalKelas.length > 0
							? kelas.jadwalKelas
									.slice()
									.sort((a, b) => {
										const hariOrder: Record<string, number> = {
											SENIN: 1,
											SELASA: 2,
											RABU: 3,
											KAMIS: 4,
											JUMAT: 5,
											SABTU: 6,
											MINGGU: 7,
										};
										return (
											(hariOrder[a.hari] ?? 99) - (hariOrder[b.hari] ?? 99)
										);
									})
									.map(
										(j: {
											hari: string;
											jamSlotTetap: {
												jamMulai: string;
												jamSelesai: string;
											} | null;
											jamSlotCustom: {
												jamMulai: string;
												jamSelesai: string;
											} | null;
											ruang: {
												namaRuang: string;
											} | null;
										}) => {
											let timeRange = "";
											if (j.jamSlotTetap) {
												timeRange = `(${j.jamSlotTetap.jamMulai} - ${j.jamSlotTetap.jamSelesai})`;
											} else if (j.jamSlotCustom) {
												timeRange = `(${j.jamSlotCustom.jamMulai} - ${j.jamSlotCustom.jamSelesai})`;
											}
											const ruangInfo = j.ruang
												? ` - ${j.ruang.namaRuang}`
												: "";
											return `${j.hari} ${timeRange}${ruangInfo}`;
										},
									)
									.join(" | ")
							: "Jadwal belum diatur";

					return (
						<Card className="py-0" key={kelas.id}>
							<CardContent className="p-0">
								<AccordionItem value={kelas.id} className="border-none">
									<AccordionTrigger className="hover:bg-muted/30 items-center px-6 py-5 transition-colors hover:no-underline">
										<div className="flex w-full flex-col gap-4">
											{/* Header: Kode & Badge */}
											<div className="flex w-full flex-col justify-between gap-2 sm:flex-row sm:items-center">
												<div className="flex items-center gap-3">
													<span className="text-foreground text-lg font-bold tracking-tight">
														{kelas.kodeKelas}
													</span>
												</div>
												<div className="flex flex-wrap items-center justify-end gap-2">
													<Badge
														variant="secondary"
														className="flex gap-1.5 px-2.5 py-1"
													>
														<GraduationCap className="h-3.5 w-3.5" />
														<span>{kelas._count.pendaftaranKelases}</span>
													</Badge>
													<Badge
														variant="outline"
														className="border-primary/30 text-primary flex gap-1.5 px-2.5 py-1"
													>
														<CalendarClock className="h-3.5 w-3.5" />
														<span>{kelas._count.sesiPertemuanKelases}</span>
													</Badge>
												</div>
											</div>

											{/* Subheader: Metadata */}
											<div className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-2 text-xs">
												<div className="flex items-center gap-1.5">
													<User className="text-primary h-3.5 w-3.5" />
													<span className="font-medium">{guruAktif}</span>
												</div>
												<div className="flex items-center gap-1.5">
													<CalendarDays className="text-primary h-3.5 w-3.5" />
													<span>{jadwalHari}</span>
												</div>
												{kelas.deskripsi && (
													<div className="flex items-center gap-1.5">
														<Album className="text-primary h-3.5 w-3.5" />
														<span className="line-clamp-1 max-w-[200px]">
															{kelas.deskripsi}
														</span>
													</div>
												)}
											</div>
										</div>
									</AccordionTrigger>

									<AccordionContent className="bg-muted/5 border-t px-6 py-5 data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
										<div className="flex flex-col gap-6">
											{/* Info Grid */}
											<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
												<div className="flex flex-col gap-1 rounded-lg border p-3">
													<span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
														Harga Kelas
													</span>
													<div className="flex items-baseline gap-1">
														<span className="text-lg font-semibold">
															{toRupiah(kelas.hargaKelas)}
														</span>
														<span className="text-muted-foreground text-xs">
															/ sesi
														</span>
													</div>
												</div>

												<div className="flex flex-col gap-1 rounded-lg border p-3">
													<span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
														Sesi Terakhir
													</span>
													<div className="font-medium">
														{lastSession ? (
															formatToWITA(lastSession)
														) : (
															<span className="text-muted-foreground italic">
																Belum ada sesi
															</span>
														)}
													</div>
												</div>
											</div>

											{/* Daftar Murid Aktif */}
											<div>
												<p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
													Murid Aktif ({kelas._count.pendaftaranKelases})
												</p>
												{kelas.pendaftaranKelases.length > 0 ? (
													<div className="flex flex-col">
														{kelas.pendaftaranKelases.map(
															(p, index: number) => (
																<div key={p.id} className="flex flex-col">
																	<div className="flex items-center justify-between py-2">
																		<div className="flex items-center py-2">
																			<span className="text-muted-foreground min-w-[24px] text-sm">
																				{index + 1}.
																			</span>
																			<span className="text-sm">
																				{p.murid?.namaLengkap ?? "Unknown"} |{" "}
																				{p.murid?.umur} |{" "}
																				{p.murid?.kelasSekolah}
																			</span>
																		</div>
																		<div>
																			{(() => {
																				const status = p.status;
																				let variant:
																					| "default"
																					| "secondary"
																					| "destructive"
																					| "outline" = "default";
																				let label = "Aktif";

																				switch (status) {
																					case StatusPendaftaran.AKTIF:
																						variant = "default";
																						label = "Aktif";
																						break;
																					case StatusPendaftaran.TRIAL:
																						variant = "secondary";
																						label = "Trial";
																						break;
																					case StatusPendaftaran.WAITING_LIST:
																						variant = "outline";
																						label = "Waiting List";
																						break;
																					case StatusPendaftaran.NON_AKTIF:
																						variant = "destructive";
																						label = "Non-Aktif";
																						break;
																				}

																				return (
																					<Badge variant={variant}>
																						{label}
																					</Badge>
																				);
																			})()}
																		</div>
																	</div>

																	{index <
																		kelas.pendaftaranKelases.length - 1 && (
																		<Separator />
																	)}
																</div>
															),
														)}
													</div>
												) : (
													<p className="text-sm text-muted-foreground italic">
														Belum ada murid aktif.
													</p>
												)}
											</div>

											{/* Action Buttons Group */}
											<div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
												<Button
													asChild
													size="sm"
													variant="ghost"
													className="w-full justify-start sm:w-auto"
												>
													<Link href={`/admin/kelas/sesi/${kelas.id}`}>
														<CalendarClock className="mr-2 h-4 w-4" />
														Riwayat Absensi
													</Link>
												</Button>

												<div className="flex items-center gap-2">
													<Button
														asChild
														size="sm"
														className="w-full sm:w-auto"
													>
														<Link href={`/admin/kelas/detail/${kelas.id}`}>
															Detail Kelas
															<ArrowRight className="ml-2 h-4 w-4" />
														</Link>
													</Button>

													<DropdownMenu>
														<DropdownMenuTrigger asChild>
															<Button
																variant="outline"
																size="icon"
																className="h-9 w-9 shrink-0"
															>
																<EllipsisVertical className="h-4 w-4" />
																<span className="sr-only">Menu</span>
															</Button>
														</DropdownMenuTrigger>
														<DropdownMenuContent align="end" className="w-48">
															<DropdownMenuItem
																onClick={() => onEditKelas(kelas)}
															>
																<Edit2 className="mr-2 h-4 w-4" />
																Edit Data Kelas
															</DropdownMenuItem>
															<DropdownMenuItem
																onClick={() => onEditGuruKelas(kelas)}
															>
																<User className="mr-2 h-4 w-4" />
																Ganti Pengajar
															</DropdownMenuItem>
															<DropdownMenuSeparator />
															<DropdownMenuItem
																onClick={() => onUpLevel(kelas)}
															>
																<TrendingUp className="mr-2 h-4 w-4" />
																Naik Level (Up Level)
															</DropdownMenuItem>
															<DropdownMenuSeparator />
															<DropdownMenuItem
																variant="destructive"
																onClick={() => onDelete(kelas)}
															>
																<Trash className="mr-2 h-4 w-4" />
																Hapus Kelas
															</DropdownMenuItem>
														</DropdownMenuContent>
													</DropdownMenu>
												</div>
											</div>
										</div>
									</AccordionContent>
								</AccordionItem>
							</CardContent>
						</Card>
					);
				})
			) : (
				<p className="text-muted-foreground text-center col-span-1 md:col-span-2">
					{emptyMessage}
				</p>
			)}
		</Accordion>
	);
}
