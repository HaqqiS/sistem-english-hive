"use client";

import { Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { api } from "@/trpc/react";

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

export default function AdminFinalReportClient() {
	const utils = api.useUtils();

	const { data, isLoading } = api.finalReport.getAll.useQuery();
	const { data: allCabang } = api.cabang.getAllForFinalReport.useQuery();

	const approve = api.finalReport.updateStatus.useMutation({
		onSuccess: () => {
			utils.finalReport.getAll.invalidate();
			toast.success("Final Report berhasil diupdate");
		},
		onError: () => toast.error("Gagal mengupdate status"),
	});

	const deleteFR = api.finalReport.delete.useMutation({
		onSuccess: () => {
			utils.finalReport.getAll.invalidate();
			toast.success("Final Report berhasil dihapus");
		},
		onError: () => toast.error("Gagal menghapus"),
	});

	// ── State ─────────────────────────────────────────
	const [selectedFR, setSelectedFR] = useState<any>(null);
	const [deletingId, setDeletingId] = useState<string | null>(null);
	const [approveDialogFR, setApproveDialogFR] = useState<any>(null);
	const [cabangForm, setCabangForm] = useState<CabangForm>(EMPTY_CABANG);
	const [isManual, setIsManual] = useState(false);
	const [selectedCabangId, setSelectedCabangId] = useState<string>("");

	// ── Handlers ──────────────────────────────────────
	const handleOpenApproveDialog = (fr: any) => {
		setApproveDialogFR(fr);
		setCabangForm(EMPTY_CABANG);
		setIsManual(false);
		setSelectedCabangId("");
	};

	const handleSelectCabang = (value: string) => {
		setSelectedCabangId(value);

		if (value === "manual") {
			setIsManual(true);
			setCabangForm(EMPTY_CABANG);
			return;
		}

		setIsManual(false);
		const cabang = allCabang?.find((c) => c.id === value);
		if (cabang) {
			setCabangForm({
				cabangNama: cabang.namaCabang,
				cabangAlamat: cabang.alamat,
				cabangNoTelp: cabang.noTelp,
				cabangEmail: cabang.email ?? "",
			});
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

	const handleDelete = async (id: string) => {
		if (!confirm("Yakin ingin menghapus Final Report ini?")) return;
		setDeletingId(id);
		try {
			await deleteFR.mutateAsync({ id });
		} finally {
			setDeletingId(null);
		}
	};

	const getStatusBadge = (status: string) => {
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
	};

	if (isLoading) return <p className="p-6">Loading...</p>;

	const showForm = cabangForm.cabangNama || isManual;

	return (
		<div className="space-y-4 p-6">
			<h1 className="text-2xl font-bold">Final Report Approval</h1>

			{data?.length === 0 && (
				<p className="text-sm text-muted-foreground">
					Belum ada Final Report masuk.
				</p>
			)}

			{data?.map((fr) => (
				<Card key={fr.id}>
					<CardContent className="space-y-4 p-5">
						{/* ROW UTAMA */}
						<div className="flex items-center justify-between">
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

							<div className="flex items-center gap-2">
								<Button
									variant="outline"
									size="sm"
									onClick={() =>
										setSelectedFR(selectedFR?.id === fr.id ? null : fr)
									}
								>
									{selectedFR?.id === fr.id ? "Hide" : "Preview"}
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
									onClick={() => handleDelete(fr.id)}
									disabled={deletingId === fr.id}
								>
									{deletingId === fr.id ? (
										<Loader2 className="h-4 w-4 animate-spin" />
									) : (
										<Trash2 className="h-4 w-4" />
									)}
								</Button>
							</div>
						</div>

						{/* CABANG INFO — tampil jika sudah approved */}
						{fr.status === "APPROVED" && fr.cabangNama && (
							<div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm">
								<p className="font-semibold text-green-800">{fr.cabangNama}</p>
								<p className="text-green-700">{fr.cabangAlamat}</p>
								{fr.cabangNoTelp && (
									<p className="text-green-700">Telp: {fr.cabangNoTelp}</p>
								)}
								{fr.cabangEmail && (
									<p className="text-green-700">Email: {fr.cabangEmail}</p>
								)}
							</div>
						)}

						{/* PREVIEW DETAIL */}
						{selectedFR?.id === fr.id && (
							<div className="space-y-4 border-t pt-4">
								<div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
									{[
										{ label: "Mid Test", value: fr.midTest },
										{ label: "Final Test", value: fr.finalTest },
										{ label: "Listening", value: fr.listening },
										{ label: "Speaking", value: fr.speaking },
										{ label: "Reading", value: fr.reading },
										{ label: "Writing", value: fr.writing },
										{ label: "Recording", value: fr.recording },
										{ label: "Attendance", value: fr.attendance },
									].map((item) => (
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
									<p className="text-xl font-bold">{fr.projectParticipation}</p>
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
						)}
					</CardContent>
				</Card>
			))}

			{/* ── DIALOG APPROVE ──────────────────────────────── */}
			<Dialog
				open={!!approveDialogFR}
				onOpenChange={() => setApproveDialogFR(null)}
			>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Approve Final Report</DialogTitle>
						<DialogDescription>
							Pilih cabang untuk mengisi data yang tampil di PDF.
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4 py-2">
						{/* PILIH CABANG */}
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
									{allCabang?.map((cabang) => (
										<SelectItem key={cabang.id} value={cabang.id}>
											{cabang.namaCabang}
										</SelectItem>
									))}
									<Separator className="my-1" />
									<SelectItem value="manual">✏️ Input manual</SelectItem>
								</SelectContent>
							</Select>
						</div>

						{/* FORM DETAIL CABANG */}
						{showForm && (
							<div className="space-y-3 rounded-lg border p-4">
								<p className="text-sm font-medium text-muted-foreground">
									{isManual ? "Input alamat cabang" : "Detail cabang"}
								</p>

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
										disabled={!isManual}
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
										disabled={!isManual}
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
										disabled={!isManual}
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
										disabled={!isManual}
									/>
								</div>
							</div>
						)}
					</div>

					<DialogFooter className="gap-2">
						<Button variant="outline" onClick={() => setApproveDialogFR(null)}>
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
		</div>
	);
}
