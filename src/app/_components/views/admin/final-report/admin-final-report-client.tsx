"use client";

import { Loader2, PlusCircle, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { DeleteConfirmationDialog } from "@/app/_components/shared/delete-confirmation-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGlobalCabangStore } from "@/store/useGlobalCabangStore";
import type { RouterOutputs } from "@/trpc/react";
import { api } from "@/trpc/react";
import { AdminFinalReportForm } from "./admin-final-report-form";

// ─── Types ────────────────────────────────────────────────────────────────────

type FinalReport = RouterOutputs["finalReport"]["getAll"][number];
type CabangOption =
	RouterOutputs["finalReport"]["getCabangForApproval"][number];

interface CabangForm {
	cabangNama: string;
	cabangAlamat: string;
	cabangNoTelp: string;
	cabangEmail: string;
}

const EMPTY_CABANG: CabangForm = {
	cabangNama: "",
	cabangAlamat: "",
	cabangNoTelp: "",
	cabangEmail: "",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getStatusBadge(status: FinalReport["status"]) {
	if (status === "APPROVED")
		return (
			<Badge
				className="bg-green-100 text-green-700 border-green-300"
				variant="outline"
			>
				Approved
			</Badge>
		);
	if (status === "REJECTED")
		return <Badge variant="destructive">Rejected</Badge>;
	return (
		<Badge
			variant="secondary"
			className="text-yellow-700 bg-yellow-50 border-yellow-300"
		>
			Pending
		</Badge>
	);
}

function cabangToCabangForm(cabang: CabangOption): CabangForm {
	return {
		cabangNama: cabang.namaCabang,
		cabangAlamat: cabang.alamat,
		cabangNoTelp: cabang.noTelp,
		cabangEmail: cabang.email ?? "",
	};
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminFinalReportClient() {
	const utils = api.useUtils();

	// Filter cabang global (pojok kiri atas sidebar) — "ALL" artinya semua cabang
	const { activeCabangId } = useGlobalCabangStore();

	const { data, isLoading } = api.finalReport.getAll.useQuery({
		cabangId: activeCabangId === "ALL" ? undefined : activeCabangId,
	});

	// Cabang list sesuai role — MANAGER dapat semua, ADMIN hanya cabang sendiri
	const { data: cabangOptions } =
		api.finalReport.getCabangForApproval.useQuery();

	const isManager = (cabangOptions?.length ?? 0) > 1;
	// Jika ADMIN: hanya ada satu cabang di list, langsung pre-fill
	const adminSingleCabang =
		!isManager && cabangOptions?.length === 1 ? cabangOptions[0] : null;

	const approve = api.finalReport.updateStatus.useMutation({
		onSuccess: () => {
			void utils.finalReport.getAll.invalidate();
			toast.success("Final Report berhasil diupdate");
		},
		onError: () => toast.error("Gagal mengupdate status"),
	});

	const deleteFR = api.finalReport.delete.useMutation({
		onSuccess: () => {
			void utils.finalReport.getAll.invalidate();
			toast.success("Final Report berhasil dihapus");
		},
		onError: () => toast.error("Gagal menghapus"),
	});

	const deleteManyFR = api.finalReport.deleteMany.useMutation({
		onSuccess: (_data, variables) => {
			void utils.finalReport.getAll.invalidate();
			toast.success(`${variables.ids.length} Final Report berhasil dihapus`);
			setSelectedIds(new Set());
		},
		onError: () => toast.error("Gagal menghapus"),
	});

	// ── State ─────────────────────────────────────────────────────────────────
	const [previewFR, setPreviewFR] = useState<FinalReport | null>(null);
	const [deleteTarget, setDeleteTarget] = useState<Pick<
		FinalReport,
		"id" | "studentName"
	> | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);
	const [approveDialogFR, setApproveDialogFR] = useState<FinalReport | null>(
		null,
	);
	const [cabangForm, setCabangForm] = useState<CabangForm>(EMPTY_CABANG);
	// Hanya relevan untuk MANAGER (bisa pilih cabang lain)
	const [selectedCabangId, setSelectedCabangId] = useState<string>("");
	// Mode input manual — tersedia untuk semua role
	const [isManual, setIsManual] = useState(false);

	// ── State seleksi untuk hapus banyak sekaligus ───────────────────────────
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
	const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
	const [isBulkDeleting, setIsBulkDeleting] = useState(false);

	// ── Handlers ──────────────────────────────────────────────────────────────

	const handleOpenApproveDialog = (fr: FinalReport) => {
		setApproveDialogFR(fr);
		setIsManual(false);
		setSelectedCabangId("");

		// ADMIN: langsung pre-fill cabang sendiri
		if (adminSingleCabang) {
			setCabangForm(cabangToCabangForm(adminSingleCabang));
		} else {
			setCabangForm(EMPTY_CABANG);
		}
	};

	// Hanya digunakan oleh MANAGER (ada dropdown pilih cabang)
	const handleSelectCabang = (value: string) => {
		setSelectedCabangId(value);

		if (value === "manual") {
			setIsManual(true);
			setCabangForm(EMPTY_CABANG);
			return;
		}

		setIsManual(false);
		const cabang = cabangOptions?.find((c) => c.id === value);
		if (cabang) {
			setCabangForm(cabangToCabangForm(cabang));
		}
	};

	const handleApprove = async () => {
		if (!approveDialogFR) return;
		await approve.mutateAsync({
			id: approveDialogFR.id,
			status: "APPROVED",
			...cabangForm,
		});
		setApproveDialogFR(null);
	};

	const handleReject = (id: string) => {
		approve.mutate({ id, status: "REJECTED" });
	};

	const handleConfirmDelete = async () => {
		if (!deleteTarget) return;
		setIsDeleting(true);
		try {
			await deleteFR.mutateAsync({ id: deleteTarget.id });
		} finally {
			setIsDeleting(false);
			setDeleteTarget(null);
		}
	};

	const toggleSelect = (id: string) => {
		setSelectedIds((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	};

	const toggleSelectAll = () => {
		if (!data) return;
		setSelectedIds((prev) =>
			prev.size === data.length ? new Set() : new Set(data.map((fr) => fr.id)),
		);
	};

	const handleConfirmBulkDelete = async () => {
		if (selectedIds.size === 0) return;
		setIsBulkDeleting(true);
		try {
			await deleteManyFR.mutateAsync({ ids: Array.from(selectedIds) });
		} finally {
			setIsBulkDeleting(false);
			setConfirmBulkDelete(false);
		}
	};

	// ── Render ────────────────────────────────────────────────────────────────

	if (isLoading) {
		return (
			<div className="space-y-4 p-6">
				<Skeleton className="h-8 w-56" />
				{[1, 2, 3].map((i) => (
					<Card key={i}>
						<CardContent className="p-5">
							<div className="flex items-center justify-between">
								{/* Kiri: nama, badge status, level·guru, final score */}
								<div className="space-y-2">
									<div className="flex items-center gap-2">
										<Skeleton className="h-5 w-36" />
										<Skeleton className="h-5 w-16 rounded-full" />
									</div>
									<Skeleton className="h-4 w-48" />
									<Skeleton className="h-4 w-24" />
								</div>
								{/* Kanan: tombol Preview + Approve + Reject + hapus */}
								<div className="flex items-center gap-2">
									<Skeleton className="h-8 w-16 rounded-md" />
									<Skeleton className="h-8 w-20 rounded-md" />
									<Skeleton className="h-8 w-16 rounded-md" />
									<Skeleton className="h-8 w-8 rounded-md" />
								</div>
							</div>
						</CardContent>
					</Card>
				))}
			</div>
		);
	}

	// Cabang form tampil jika: ada isi cabangNama ATAU sedang manual
	const showCabangDetail = !!cabangForm.cabangNama || isManual;

	return (
		<Tabs defaultValue="approval" className="space-y-4 p-6">
			<TabsList>
				<TabsTrigger value="approval">Final Report Approval</TabsTrigger>
				<TabsTrigger value="buat-sendiri">
					<PlusCircle className="mr-2 h-4 w-4" />
					Buat Final Report
				</TabsTrigger>
			</TabsList>

			<TabsContent value="buat-sendiri" className="-mx-6 -mt-2">
				<AdminFinalReportForm />
			</TabsContent>

			<TabsContent value="approval" className="space-y-2 max-w-3xl">
				<h1 className="text-2xl font-bold">Final Report Approval</h1>

				{/* Info filter cabang aktif — mengikuti switcher cabang di sidebar (pojok kiri atas) */}
				{isManager && activeCabangId !== "ALL" && (
					<p className="text-muted-foreground text-sm">
						Menampilkan Final Report dari cabang:{" "}
						<span className="text-foreground font-medium">
							{cabangOptions?.find((c) => c.id === activeCabangId)
								?.namaCabang ?? "-"}
						</span>
					</p>
				)}

				{data?.length === 0 && (
					<p className="text-sm text-muted-foreground">
						Belum ada Final Report masuk.
					</p>
				)}

				{/* TOOLBAR SELEKSI — hapus banyak sekaligus */}
				{(data?.length ?? 0) > 0 && (
					<div className="flex items-center justify-between rounded-lg border bg-muted/40 px-3 py-1.5">
						<label
							htmlFor="select-all-final-report"
							className="flex items-center gap-2 text-sm cursor-pointer select-none"
						>
							<Checkbox
								id="select-all-final-report"
								checked={
									data && data.length > 0 && selectedIds.size === data.length
								}
								onCheckedChange={toggleSelectAll}
							/>
							{selectedIds.size > 0
								? `${selectedIds.size} dipilih`
								: "Pilih semua"}
						</label>

						{selectedIds.size > 0 && (
							<Button
								variant="destructive"
								size="sm"
								onClick={() => setConfirmBulkDelete(true)}
							>
								<Trash2 className="mr-2 h-4 w-4" />
								Hapus {selectedIds.size} Terpilih
							</Button>
						)}
					</div>
				)}

				{data?.map((fr) => (
					<Card key={fr.id}>
						<CardContent className="space-y-1.5 px-5 py-2">
							{/* ROW UTAMA */}
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-3">
									<Checkbox
										checked={selectedIds.has(fr.id)}
										onCheckedChange={() => toggleSelect(fr.id)}
										className="shrink-0"
									/>
									<div className="space-y-0.5">
										<div className="flex items-center gap-2">
											<p className="font-bold">{fr.studentName}</p>
											{getStatusBadge(fr.status)}
										</div>
										<p className="text-sm text-muted-foreground">
											{fr.level} · {fr.teacherName}
										</p>
										<p className="text-sm">
											Final Score:{" "}
											<span className="font-semibold">{fr.finalScore}</span>
										</p>
									</div>
								</div>

								<div className="flex items-center gap-2">
									<Button
										variant="outline"
										size="sm"
										onClick={() =>
											setPreviewFR(previewFR?.id === fr.id ? null : fr)
										}
									>
										{previewFR?.id === fr.id ? "Hide" : "Preview"}
									</Button>

									{fr.status === "PENDING" && (
										<>
											<Button
												size="sm"
												onClick={() => handleOpenApproveDialog(fr)}
											>
												Approve
											</Button>
											<Button
												size="sm"
												variant="destructive"
												onClick={() => handleReject(fr.id)}
											>
												Reject
											</Button>
										</>
									)}

									<Button
										variant="ghost"
										size="icon"
										className="text-destructive hover:text-destructive hover:bg-destructive/10"
										onClick={() =>
											setDeleteTarget({
												id: fr.id,
												studentName: fr.studentName,
											})
										}
									>
										<Trash2 className="h-4 w-4" />
									</Button>
								</div>
							</div>

							{/* PREVIEW DETAIL */}
							<div
								className={[
									"grid transition-all duration-300 ease-in-out",
									previewFR?.id === fr.id
										? "grid-rows-[1fr] opacity-100"
										: "grid-rows-[0fr] opacity-0",
								].join(" ")}
							>
								<div className="overflow-hidden">
									<div className="space-y-4 border-t pt-4">
										<div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
											{(
												[
													{ label: "Mid Test", value: fr.midTest },
													{ label: "Final Test", value: fr.finalTest },
													{ label: "Listening", value: fr.listening },
													{ label: "Speaking", value: fr.speaking },
													{ label: "Reading", value: fr.reading },
													{ label: "Writing", value: fr.writing },
													{ label: "Recording", value: fr.recording },
													{ label: "Attendance", value: fr.attendance },
												] as const
											).map((item) => (
												<div key={item.label}>
													<p className="text-xs text-muted-foreground">
														{item.label}
													</p>
													<p className="font-bold">{item.value}</p>
												</div>
											))}
										</div>

										<div className="rounded-xl bg-muted p-4">
											<p className="text-sm text-muted-foreground">
												Project & Participation
											</p>
											<p className="text-xl font-bold">
												{fr.projectParticipation}
											</p>
										</div>

										{fr.notes && (
											<div className="rounded-xl bg-muted p-4">
												<p className="text-sm text-muted-foreground">
													Teacher Notes
												</p>
												<p>{fr.notes}</p>
											</div>
										)}
									</div>
								</div>
							</div>
						</CardContent>
					</Card>
				))}

				{/* ── DIALOG APPROVE ─────────────────────────────── */}
				<Dialog
					open={!!approveDialogFR}
					onOpenChange={(open) => {
						if (!open) setApproveDialogFR(null);
					}}
				>
					<DialogContent className="sm:max-w-md">
						<DialogHeader>
							<DialogTitle>Approve Final Report</DialogTitle>
							<DialogDescription>
								{isManager
									? "Pilih cabang yang akan tertera di PDF laporan."
									: "Konfirmasi data cabang yang akan tertera di PDF laporan."}
							</DialogDescription>
						</DialogHeader>

						<div className="space-y-4 py-2">
							{/* PILIH CABANG — hanya tampil untuk MANAGER */}
							{isManager && (
								<div className="space-y-1.5">
									<Label>Pilih Cabang</Label>
									<Select
										value={selectedCabangId}
										onValueChange={handleSelectCabang}
									>
										<SelectTrigger>
											<SelectValue placeholder="Pilih cabang..." />
										</SelectTrigger>
										<SelectContent>
											{cabangOptions?.map((cabang) => (
												<SelectItem key={cabang.id} value={cabang.id}>
													{cabang.namaCabang}
												</SelectItem>
											))}
											<Separator className="my-1" />
											<SelectItem value="manual">✏️ Input manual</SelectItem>
										</SelectContent>
									</Select>
								</div>
							)}

							{/* DETAIL CABANG — selalu tampil untuk ADMIN (pre-filled), tampil setelah pilih untuk MANAGER */}
							{(showCabangDetail || !isManager) && (
								<div className="space-y-3 rounded-lg border p-4">
									<div className="flex items-center justify-between">
										<p className="text-sm font-medium text-muted-foreground">
											{isManual ? "Input alamat cabang" : "Detail cabang"}
										</p>
										{/* ADMIN bisa switch ke manual jika perlu koreksi */}
										{!isManager && !isManual && (
											<button
												type="button"
												className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
												onClick={() => setIsManual(true)}
											>
												Edit manual
											</button>
										)}
										{!isManager && isManual && (
											<button
												type="button"
												className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
												onClick={() => {
													setIsManual(false);
													if (adminSingleCabang) {
														setCabangForm(
															cabangToCabangForm(adminSingleCabang),
														);
													}
												}}
											>
												Reset ke cabang
											</button>
										)}
									</div>

									<div className="space-y-1.5">
										<Label>Nama Cabang</Label>
										<Input
											value={cabangForm.cabangNama}
											onChange={(e) =>
												setCabangForm((f) => ({
													...f,
													cabangNama: e.target.value,
												}))
											}
											placeholder="Contoh: Cabang Denpasar"
											disabled={!isManual && !isManager}
										/>
									</div>

									<div className="space-y-1.5">
										<Label>Alamat</Label>
										<Input
											value={cabangForm.cabangAlamat}
											onChange={(e) =>
												setCabangForm((f) => ({
													...f,
													cabangAlamat: e.target.value,
												}))
											}
											placeholder="Jl. ..."
											disabled={!isManual && !isManager}
										/>
									</div>

									<div className="space-y-1.5">
										<Label>No. Telepon</Label>
										<Input
											value={cabangForm.cabangNoTelp}
											onChange={(e) =>
												setCabangForm((f) => ({
													...f,
													cabangNoTelp: e.target.value,
												}))
											}
											placeholder="+62..."
											disabled={!isManual && !isManager}
										/>
									</div>

									<div className="space-y-1.5">
										<Label>Email</Label>
										<Input
											value={cabangForm.cabangEmail}
											onChange={(e) =>
												setCabangForm((f) => ({
													...f,
													cabangEmail: e.target.value,
												}))
											}
											placeholder="email@englishhive.com"
											disabled={!isManual && !isManager}
										/>
									</div>
								</div>
							)}
						</div>

						<DialogFooter className="gap-2">
							<Button
								variant="outline"
								onClick={() => setApproveDialogFR(null)}
							>
								Batal
							</Button>
							<Button onClick={handleApprove} disabled={approve.isPending}>
								{approve.isPending && (
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								)}
								Approve
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>

				{/* ── DIALOG KONFIRMASI HAPUS ─────────────────────── */}
				<DeleteConfirmationDialog
					isOpen={!!deleteTarget}
					onOpenChange={(open) => {
						if (!open) setDeleteTarget(null);
					}}
					title="Hapus Final Report?"
					description={
						<span>
							Final Report milik{" "}
							<span className="font-semibold">{deleteTarget?.studentName}</span>{" "}
							akan dihapus permanen dan tidak bisa dikembalikan.
						</span>
					}
					onConfirm={handleConfirmDelete}
					confirmText="Hapus"
					cancelText="Batal"
					isLoading={isDeleting}
				/>

				{/* ── DIALOG KONFIRMASI HAPUS BANYAK SEKALIGUS ────── */}
				<DeleteConfirmationDialog
					isOpen={confirmBulkDelete}
					onOpenChange={(open) => {
						if (!open) setConfirmBulkDelete(false);
					}}
					title={`Hapus ${selectedIds.size} Final Report?`}
					description={
						<span>
							<span className="font-semibold">{selectedIds.size}</span> Final
							Report yang dipilih akan dihapus permanen dan tidak bisa
							dikembalikan.
						</span>
					}
					onConfirm={handleConfirmBulkDelete}
					confirmText="Hapus Semua"
					cancelText="Batal"
					isLoading={isBulkDeleting}
				/>
			</TabsContent>
		</Tabs>
	);
}
