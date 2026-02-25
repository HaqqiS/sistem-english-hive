"use client";

import { StatusAbsenMurid } from "@prisma/client";
import {
	AlertCircle,
	Check,
	Edit,
	FileText,
	Loader2,
	Trash2,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSesiPertemuan } from "@/hooks/useSesiPertemuan";
import { api } from "@/trpc/react";
import dayjs, {
	convertWITAtoUTC,
	formatToWITA,
	TIMEZONE_BISNIS,
} from "@/utils/dateUtils";

/**
 * Helper untuk mendapatkan teks dan varian badge berdasarkan status absensi
 */
function getBadgeContent(status: StatusAbsenMurid | null): {
	text: string;
	variant: "default" | "destructive" | "secondary" | "outline";
} {
	switch (status) {
		case StatusAbsenMurid.HADIR:
			return { text: "H", variant: "default" }; // Hijau
		case StatusAbsenMurid.ALPA:
			return { text: "A", variant: "destructive" }; // Merah
		case StatusAbsenMurid.OFF_SEMENTARA:
			return { text: "Off", variant: "secondary" }; // Abu-abu
		default:
			return { text: "-", variant: "outline" }; // Kosong
	}
}

export default function DetailSesiClient() {
	const { kelasId } = useParams<{ kelasId: string }>();

	// Dialog State
	const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
	const [editingSesiId, setEditingSesiId] = useState<string | null>(null);
	// Format string untuk input datetime-local: "YYYY-MM-DDTHH:mm"
	const [editDateValue, setEditDateValue] = useState<string>("");

	// Delete Alert State
	const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
	const [deletingSesiId, setDeletingSesiId] = useState<string | null>(null);

	// 1. Ambil data summary menggunakan hook
	const {
		dataSummary,
		isLoadingSummary,
		isErrorSummary,
		errorSummary,
		mutations,
		invalidate,
	} = useSesiPertemuan({
		kelasId: kelasId,
	});

	// Mutation untuk update Absensi
	const updateAbsensiMutation =
		api.absenMurid.createOrUpdateAbsensi.useMutation({
			onSuccess: async () => {
				await invalidate();
				toast.success("Absensi berhasil diperbarui");
			},
			onError: (error) => {
				toast.error(`Gagal update absensi: ${error.message}`);
			},
		});

	// -- HANDLERS --

	const handleEditDateClick = (sesiId: string, currentDate: Date) => {
		setEditingSesiId(sesiId);
		// Konversi Date ke format local string untuk input (WITA)
		const formatted = dayjs(currentDate)
			.tz(TIMEZONE_BISNIS)
			.format("YYYY-MM-DDTHH:mm");
		setEditDateValue(formatted);
		setIsEditDialogOpen(true);
	};

	const handleSaveDate = async () => {
		if (!editingSesiId || !editDateValue) return;

		try {
			// Konversi balik dari WITA string ke UTC Date
			const newDate = convertWITAtoUTC(editDateValue);

			await mutations.update.mutateAsync({
				id: editingSesiId,
				tanggalWaktu: newDate,
			});

			setIsEditDialogOpen(false);
			setEditingSesiId(null);
		} catch (_error) {
			// Error handled in hook
		}
	};

	const handleDeleteClick = (sesiId: string) => {
		setDeletingSesiId(sesiId);
		setIsDeleteAlertOpen(true);
	};

	const handleConfirmDelete = async () => {
		if (!deletingSesiId) return;
		try {
			await mutations.delete.mutateAsync({ id: deletingSesiId });
			setIsDeleteAlertOpen(false);
			setDeletingSesiId(null);
		} catch (_error) {
			// Error handled in hook
		}
	};

	const handleAttendanceChange = (
		sesiId: string,
		studentId: string,
		status: StatusAbsenMurid,
	) => {
		updateAbsensiMutation.mutate({
			sesiId,
			muridId: studentId,
			status,
		});
	};

	// 2. Loading State
	if (isLoadingSummary) {
		return (
			<Card>
				<CardHeader>
					<Skeleton className="h-8 w-1/2" />
					<Skeleton className="h-4 w-1/4" />
				</CardHeader>
				<CardContent>
					<Skeleton className="h-64 w-full" />
				</CardContent>
			</Card>
		);
	}

	// 3. Error State
	if (isErrorSummary) {
		return (
			<Alert variant="destructive">
				<AlertCircle className="h-4 w-4" />
				<AlertTitle>Gagal Memuat Data</AlertTitle>
				<AlertDescription>{errorSummary?.message}</AlertDescription>
			</Alert>
		);
	}

	// 4. Empty State (Data ada tapi tidak ada sesi)
	if (!dataSummary || dataSummary.columnData.length === 0) {
		return (
			<Card className="flex flex-col items-center justify-center p-10">
				<FileText className="text-muted-foreground h-16 w-16" />
				<CardTitle className="mt-4">Belum Ada Sesi</CardTitle>
				<CardDescription className="mt-2 text-center">
					Belum ada sesi pertemuan yang tercatat untuk kelas ini.
				</CardDescription>
			</Card>
		);
	}

	const { kelasInfo, columnData, rowData } = dataSummary;

	// 5. Success State (Render Tabel)
	return (
		<TooltipProvider delayDuration={150}>
			<Card>
				<CardHeader>
					<CardTitle>Detail Sesi: {kelasInfo.kodeKelas}</CardTitle>
					<CardDescription>
						Guru Aktif Saat Ini:{" "}
						<span className="text-foreground font-medium">
							{kelasInfo.guruAktif}
						</span>
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="overflow-x-auto rounded-md border pb-4">
						<Table className="min-w-max">
							<TableHeader>
								{/* --- Baris Header 1: Tanggal --- */}
								<TableRow>
									<TableHead
										rowSpan={3}
										className="bg-muted sticky left-0 min-w-40 border-r align-middle z-20"
									>
										Nama Siswa
									</TableHead>
									{columnData.map((col) => (
										<TableHead
											key={col.sesiId}
											className="p-0 text-center align-top relative group"
										>
											<div className="flex flex-col items-center justify-center pt-2 gap-1 border-b pb-1">
												<Tooltip>
													<TooltipTrigger asChild>
														<div className="cursor-help font-semibold text-xs uppercase tracking-wider">
															{formatToWITA(col.tanggal, "dddd")} <br />
															{formatToWITA(col.tanggal, "DD/MM")}
														</div>
													</TooltipTrigger>
													<TooltipContent>
														{formatToWITA(
															col.tanggal,
															"dddd, D MMMM YYYY, HH:mm",
														)}
													</TooltipContent>
												</Tooltip>

												{/* Edit & Delete Buttons */}
												<div className="flex flex-row gap-0.5">
													<Button
														variant="ghost"
														size="icon"
														className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
														onClick={() =>
															handleEditDateClick(
																col.sesiId,
																new Date(col.tanggal),
															)
														}
													>
														<Edit className="h-3 w-3" />
													</Button>
													<Button
														variant="ghost"
														size="icon"
														className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
														onClick={() => handleDeleteClick(col.sesiId)}
													>
														<Trash2 className="h-3 w-3" />
													</Button>
												</div>
											</div>
										</TableHead>
									))}
								</TableRow>

								{/* --- Baris Header 2: Pertemuan Ke --- */}
								<TableRow>
									{columnData.map((col) => (
										<TableHead
											key={col.sesiId}
											className="text-center text-xs text-muted-foreground"
										>
											{col.pertemuanKe}
										</TableHead>
									))}
								</TableRow>

								{/* --- Baris Header 3: Pengajar --- */}
								<TableRow>
									{columnData.map((col) => (
										<TableHead
											key={col.sesiId}
											className="text-center text-xs font-medium"
										>
											{col.pengajar}
										</TableHead>
									))}
								</TableRow>
							</TableHeader>
							<TableBody>
								{rowData.map((row) => (
									<TableRow key={row.studentId}>
										{/* Kolom Nama Siswa (Sticky) */}
										<TableCell className="bg-background sticky left-0 border-r font-medium text-sm z-20">
											{row.namaSiswa}
										</TableCell>

										{/* Kolom Absensi (Dinamis) */}
										{columnData.map((col) => {
											const status = row.attendance[col.sesiId];
											const { text, variant } = getBadgeContent(status ?? null);

											const isUpdating =
												updateAbsensiMutation.isPending &&
												updateAbsensiMutation.variables?.sesiId ===
													col.sesiId &&
												updateAbsensiMutation.variables?.muridId ===
													row.studentId;

											return (
												<TableCell key={col.sesiId} className="text-center p-1">
													<DropdownMenu>
														<DropdownMenuTrigger asChild>
															<Button
																variant={variant}
																className={`h-7 w-9 p-0 text-xs ${status === null ? "opacity-50" : ""}`}
																disabled={isUpdating}
															>
																{isUpdating ? (
																	<Loader2 className="h-3 w-3 animate-spin" />
																) : (
																	text
																)}
															</Button>
														</DropdownMenuTrigger>
														<DropdownMenuContent align="center">
															<DropdownMenuItem
																onClick={() =>
																	handleAttendanceChange(
																		col.sesiId,
																		row.studentId,
																		StatusAbsenMurid.HADIR,
																	)
																}
															>
																<div className="flex items-center gap-2">
																	<Badge
																		variant="default"
																		className="w-5 justify-center"
																	>
																		H
																	</Badge>{" "}
																	Hadir
																	{status === StatusAbsenMurid.HADIR && (
																		<Check className="h-3 w-3 ml-auto" />
																	)}
																</div>
															</DropdownMenuItem>
															<DropdownMenuItem
																onClick={() =>
																	handleAttendanceChange(
																		col.sesiId,
																		row.studentId,
																		StatusAbsenMurid.ALPA,
																	)
																}
															>
																<div className="flex items-center gap-2">
																	<Badge
																		variant="destructive"
																		className="w-5 justify-center"
																	>
																		A
																	</Badge>{" "}
																	Alpa
																	{status === StatusAbsenMurid.ALPA && (
																		<Check className="h-3 w-3 ml-auto" />
																	)}
																</div>
															</DropdownMenuItem>
															<DropdownMenuItem
																onClick={() =>
																	handleAttendanceChange(
																		col.sesiId,
																		row.studentId,
																		StatusAbsenMurid.OFF_SEMENTARA,
																	)
																}
															>
																<div className="flex items-center gap-2">
																	<Badge
																		variant="secondary"
																		className="w-5 justify-center"
																	>
																		O
																	</Badge>{" "}
																	Off
																	{status ===
																		StatusAbsenMurid.OFF_SEMENTARA && (
																		<Check className="h-3 w-3 ml-auto" />
																	)}
																</div>
															</DropdownMenuItem>
														</DropdownMenuContent>
													</DropdownMenu>
												</TableCell>
											);
										})}
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>
				</CardContent>

				{/* Dialog Edit Sesi */}
				<Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Edit Jadwal Sesi</DialogTitle>
							<DialogDescription>
								Ubah tanggal dan waktu untuk sesi pertemuan ini.
							</DialogDescription>
						</DialogHeader>
						<div className="grid gap-4 py-4">
							<div className="grid grid-cols-4 items-center gap-4">
								<Label htmlFor="datetime" className="text-right">
									Waktu
								</Label>
								<Input
									id="datetime"
									type="datetime-local"
									value={editDateValue}
									onChange={(e) => setEditDateValue(e.target.value)}
									className="col-span-3"
								/>
							</div>
						</div>
						<DialogFooter>
							<Button
								variant="outline"
								onClick={() => setIsEditDialogOpen(false)}
							>
								Batal
							</Button>
							<Button
								onClick={handleSaveDate}
								disabled={mutations.update.isPending}
							>
								{mutations.update.isPending && (
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								)}
								Simpan Perubahan
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>

				{/* Alert Dialog Konfirmasi Hapus Sesi */}
				<AlertDialog
					open={isDeleteAlertOpen}
					onOpenChange={setIsDeleteAlertOpen}
				>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>Hapus Sesi Pertemuan?</AlertDialogTitle>
							<AlertDialogDescription>
								Tindakan ini tidak dapat dibatalkan. Sesi pertemuan beserta
								seluruh data absensi di dalamnya akan dihapus secara permanen.
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel disabled={mutations.delete.isPending}>
								Batal
							</AlertDialogCancel>
							<AlertDialogAction
								onClick={handleConfirmDelete}
								disabled={mutations.delete.isPending}
								className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
							>
								{mutations.delete.isPending ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Menghapus...
									</>
								) : (
									"Ya, Hapus"
								)}
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			</Card>
		</TooltipProvider>
	);
}
