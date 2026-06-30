"use client";

import {
	CalendarIcon,
	CheckCircle2,
	ChevronRight,
	FileText,
	Loader2,
	Send,
	Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
	AlertDialog,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useGlobalCabangStore } from "@/store/useGlobalCabangStore";
import { api } from "@/trpc/react";

// ─── Types ────────────────────────────────────────────

interface ScoreField {
	key: string;
	label: string;
}

type ScoreMap = Record<string, string>;
type ReportType = "4-aspek" | "2-aspek";

const SKILL_FIELDS_FULL: ScoreField[] = [
	{ key: "listening", label: "Listening" },
	{ key: "speaking", label: "Speaking" },
	{ key: "reading", label: "Reading" },
	{ key: "writing", label: "Writing" },
];

const SKILL_FIELDS_SIMPLE: ScoreField[] = [
	{ key: "listening", label: "Listening" },
	{ key: "speaking", label: "Speaking" },
];

const RECORDING_OPTIONS = [
	{ value: "0", label: "0 — Tidak recording sama sekali" },
	{ value: "1", label: "1 — Recording Sekali" },
	{ value: "2", label: "2 — Recording dua kali" },
	{ value: "3", label: "3 — Recording tiga kali" },
	{ value: "4", label: "4 — Recording lengkap" },
];

// ─── Helpers ──────────────────────────────────────────

function getDescription(score: number) {
	if (score >= 90) return "Excellent";
	if (score >= 80) return "Very Good";
	if (score >= 70) return "Good";
	return "Poor";
}

function getScoreColor(score: number) {
	if (score >= 90) return "text-green-600";
	if (score >= 80) return "text-blue-600";
	if (score >= 70) return "text-amber-600";
	return "text-red-500";
}

// ─── Component ────────────────────────────────────────

export function AdminFinalReportForm() {
	const utils = api.useUtils();

	// Cabang yang sedang aktif di filter sidebar (pojok kiri atas)
	const { activeCabangId } = useGlobalCabangStore();

	// ── Data queries ──────────────────────────────────
	const { data: kelasList, isLoading: loadingKelas } =
		api.finalReport.getKelasByCabangFilter.useQuery({
			cabangId: activeCabangId === "ALL" ? undefined : activeCabangId,
		});

	// Daftar Jenis Kelas untuk dropdown Level manual (independen dari kelas yang dipilih)
	const { data: jenisKelasList, isLoading: loadingJenisKelas } =
		api.jenisKelas.getJenisKelasList.useQuery({
			cabangId: activeCabangId === "ALL" ? undefined : activeCabangId,
		});

	// Cabang yang akan tercetak di laporan.
	// MANAGER: dapat semua cabang & wajib pilih manual.
	// ADMIN: dapat array satu item (cabangnya sendiri), otomatis terpilih.
	const { data: cabangOptions, isLoading: loadingCabang } =
		api.finalReport.getCabangForApproval.useQuery();
	const isManagerCabang = (cabangOptions?.length ?? 0) > 1;

	// ── Mutations ─────────────────────────────────────
	const submitReport = api.finalReport.create.useMutation({
		onSuccess: async () => {
			toast.success("Final Report berhasil dibuat & otomatis disetujui");
			resetForm();
			await utils.finalReport.getAll.invalidate();
		},
		onError: (err) => toast.error(err.message ?? "Gagal membuat Final Report"),
	});

	// ── Form state ────────────────────────────────────
	const [selectedKelasId, setSelectedKelasId] = useState("");
	const [selectedMuridId, setSelectedMuridId] = useState("");
	const [selectedGuruId, setSelectedGuruId] = useState("");
	// Level laporan — independen dari kelas yang dipilih (untuk ambil data murid)
	const [selectedJenisKelasId, setSelectedJenisKelasId] = useState("");
	const [selectedLevel, setSelectedLevel] = useState("");
	// Cabang yang tercetak di laporan — MANAGER pilih manual, ADMIN otomatis
	const [selectedCabangId, setSelectedCabangId] = useState("");
	const [scores, setScores] = useState<ScoreMap>({
		midTest: "",
		finalTest: "",
		listening: "",
		speaking: "",
		reading: "",
		writing: "",
		attendance: "",
	});
	const [recording, setRecording] = useState("0");
	const [notes, setNotes] = useState("");
	const [reportType, setReportType] = useState<ReportType>("4-aspek");
	const [graduationDate, setGraduationDate] = useState<string>("");
	const [graduationDateOpen, setGraduationDateOpen] = useState(false);
	const [showConfirmDialog, setShowConfirmDialog] = useState(false);

	// ── Derived data ──────────────────────────────────
	const selectedKelas = kelasList?.find((k) => k.id === selectedKelasId);

	const muridList = selectedKelas?.pendaftaranKelases.map((p) => p.murid) ?? [];
	const guruList = selectedKelas?.historyGuruKelases.map((h) => h.guru) ?? [];

	const selectedMurid = muridList.find((m) => m.id === selectedMuridId);
	const selectedGuru = guruList.find((g) => g.id === selectedGuruId);

	const selectedJenisKelas = jenisKelasList?.find(
		(j) => j.id === selectedJenisKelasId,
	);

	// Label level laporan — diambil dari pilihan manual Jenis Kelas + Level
	const kelasLabel =
		selectedJenisKelas && selectedLevel
			? `${selectedJenisKelas.nama} Level ${selectedLevel}`
			: "";

	const handleKelasChange = (kelasId: string) => {
		setSelectedKelasId(kelasId);
		setSelectedMuridId("");
		setSelectedGuruId("");
	};

	// ── Auto-fetch kehadiran dari absensi ─────────────
	const { data: attendanceData, isLoading: loadingAttendance } =
		api.finalReport.getAttendanceByMuridKelas.useQuery(
			{ muridId: selectedMuridId, kelasId: selectedKelasId },
			{ enabled: !!(selectedMuridId && selectedKelasId) },
		);

	useEffect(() => {
		if (attendanceData) {
			setScores((prev) => ({
				...prev,
				attendance: String(attendanceData.hadirCount),
			}));
		}
	}, [attendanceData]);

	useEffect(() => {
		if (!selectedMuridId || !selectedKelasId) {
			setScores((prev) => ({ ...prev, attendance: "" }));
		}
	}, [selectedMuridId, selectedKelasId]);

	// Auto-pilih cabang untuk ADMIN (hanya ada 1 opsi: cabangnya sendiri)
	useEffect(() => {
		if (!isManagerCabang && cabangOptions?.length === 1) {
			setSelectedCabangId(cabangOptions[0]?.id ?? "");
		}
	}, [isManagerCabang, cabangOptions]);

	// ── Calculated scores ─────────────────────────────
	const n = (key: string) => Number(scores[key]) || 0;

	const projectParticipation = useMemo(() => {
		const recordingMap: Record<string, number> = {
			"0": 0,
			"1": 55,
			"2": 70,
			"3": 85,
			"4": 100,
		};
		const recordingScore = recordingMap[recording] ?? 0;
		const attendanceScore = ((Number(scores.attendance) || 0) / 23) * 100;
		return Number((recordingScore * 0.5 + attendanceScore * 0.5).toFixed(1));
	}, [recording, scores.attendance]);

	const finalScore = useMemo(() => {
		const listening = Number(scores.listening) || 0;
		const speaking = Number(scores.speaking) || 0;
		const reading = Number(scores.reading) || 0;
		const writing = Number(scores.writing) || 0;
		const total =
			listening + speaking + reading + writing + projectParticipation;
		return Number((total / 5).toFixed(1));
	}, [
		scores.listening,
		scores.speaking,
		scores.reading,
		scores.writing,
		projectParticipation,
	]);

	// ── Validasi form lengkap ─────────────────────────
	const skillFields =
		reportType === "2-aspek" ? SKILL_FIELDS_SIMPLE : SKILL_FIELDS_FULL;

	const requiredScoreKeys = useMemo(
		() => [
			"midTest",
			"finalTest",
			"listening",
			"speaking",
			...(reportType === "4-aspek" ? ["reading", "writing"] : []),
			"attendance",
		],
		[reportType],
	);

	const formErrors = useMemo(() => {
		const errors: string[] = [];
		if (!selectedKelasId) errors.push("Pilih kelas terlebih dahulu");
		if (!selectedMuridId) errors.push("Pilih siswa terlebih dahulu");
		if (!selectedGuruId) errors.push("Pilih guru pengajar terlebih dahulu");
		if (!selectedJenisKelasId) errors.push("Pilih jenis kelas untuk laporan");
		if (!selectedLevel) errors.push("Pilih level untuk laporan");
		if (isManagerCabang && !selectedCabangId)
			errors.push("Pilih cabang untuk laporan");
		if (!graduationDate) errors.push("Tanggal kelulusan belum diisi");
		for (const key of requiredScoreKeys) {
			if (scores[key] === "" || scores[key] === undefined) {
				const labels: Record<string, string> = {
					midTest: "Mid Test",
					finalTest: "Final Test",
					listening: "Listening",
					speaking: "Speaking",
					reading: "Reading",
					writing: "Writing",
					attendance: "Kehadiran",
				};
				errors.push(`${labels[key]} belum diisi`);
			}
		}
		return errors;
	}, [
		selectedKelasId,
		selectedMuridId,
		selectedGuruId,
		selectedJenisKelasId,
		selectedLevel,
		selectedCabangId,
		isManagerCabang,
		scores,
		graduationDate,
		requiredScoreKeys,
	]);

	const isFormValid = formErrors.length === 0;

	// ── Handlers ──────────────────────────────────────
	const resetForm = () => {
		setSelectedKelasId("");
		setSelectedMuridId("");
		setSelectedGuruId("");
		setSelectedJenisKelasId("");
		setSelectedLevel("");
		if (isManagerCabang) setSelectedCabangId("");
		setScores({
			midTest: "",
			finalTest: "",
			listening: "",
			speaking: "",
			reading: "",
			writing: "",
			attendance: "",
		});
		setRecording("0");
		setNotes("");
		setGraduationDate("");
	};

	const handleScoreChange = (key: string, value: string) => {
		if (value === "" || value === "-") {
			setScores((prev) => ({ ...prev, [key]: value }));
			return;
		}
		const max = key === "attendance" ? 23 : 100;
		const clamped = Math.min(Math.max(0, Number(value)), max);
		setScores((prev) => ({ ...prev, [key]: String(clamped) }));
	};

	const handleSubmitClick = () => {
		if (!isFormValid) {
			toast.error(formErrors[0] ?? "Lengkapi semua data terlebih dahulu");
			return;
		}
		setShowConfirmDialog(true);
	};

	const handleConfirmSubmit = () => {
		setShowConfirmDialog(false);
		if (!selectedMurid || !selectedGuru) return;
		submitReport.mutate({
			studentName: selectedMurid.namaLengkap,
			studentId: selectedMuridId,
			level: kelasLabel,
			midTest: n("midTest"),
			finalTest: n("finalTest"),
			listening: n("listening"),
			speaking: n("speaking"),
			reading: reportType === "2-aspek" ? 0 : n("reading"),
			writing: reportType === "2-aspek" ? 0 : n("writing"),
			recording: Number(recording),
			attendance: n("attendance"),
			projectParticipation,
			finalScore,
			notes: notes || undefined,
			graduationDate: graduationDate ? new Date(graduationDate) : undefined,
			teacherUserId: selectedGuru.id,
			teacherName: selectedGuru.name ?? "Unknown",
			cabangId: selectedCabangId || undefined,
		});
	};

	// ─── Render ───────────────────────────────────────
	return (
		<div className="mx-auto max-w-5xl space-y-8 p-6">
			{/* HEADER */}
			<div className="flex items-center gap-3">
				<div className="bg-primary/10 rounded-xl p-2.5">
					<FileText className="text-primary h-6 w-6" />
				</div>
				<div>
					<h1 className="text-2xl font-bold">Buat Final Report</h1>
					<p className="text-muted-foreground text-sm">
						Dibuat oleh Admin/Manager — otomatis tersetujui (APPROVED).
						Mengambil semua kelas dari cabang yang sedang difilter.
					</p>
				</div>
			</div>

			{/* ── FORM ─────────────────────────────────────── */}
			<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
				{/* KIRI: Form Input */}
				<div className="lg:col-span-2 space-y-5">
					{/* STEP 1: Pilih Kelas, Guru & Siswa */}
					<Card>
						<CardHeader className="pb-4">
							<CardTitle className="flex items-center gap-2 text-base">
								<span className="bg-primary text-primary-foreground flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold">
									1
								</span>
								Pilih Kelas, Guru & Siswa
							</CardTitle>
							<CardDescription>
								Kelas diambil dari cabang yang sedang difilter di sidebar
							</CardDescription>
						</CardHeader>

						<CardContent className="space-y-4">
							{/* Pilih Kelas */}
							<div className="space-y-1.5">
								<Label>Kelas</Label>
								<Select
									value={selectedKelasId}
									onValueChange={handleKelasChange}
									disabled={loadingKelas}
								>
									<SelectTrigger>
										<SelectValue
											placeholder={
												loadingKelas ? "Memuat kelas..." : "Pilih kelas..."
											}
										/>
									</SelectTrigger>
									<SelectContent>
										{kelasList?.length === 0 && (
											<SelectItem value="_empty" disabled>
												Tidak ada kelas aktif di cabang ini
											</SelectItem>
										)}
										{kelasList?.map((kelas) => (
											<SelectItem key={kelas.id} value={kelas.id}>
												<span className="font-medium">
													{kelas.jenisKelasRel?.nama ?? "Kelas"}
												</span>
												<span className="text-muted-foreground ml-1.5">
													Level {kelas.level} · {kelas.kodeKelas}
												</span>
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							{/* Pilih Guru */}
							<div className="space-y-1.5">
								<Label>
									Guru Pengajar
									<span className="text-destructive ml-0.5">*</span>
								</Label>
								<Select
									value={selectedGuruId}
									onValueChange={setSelectedGuruId}
									disabled={!selectedKelasId || guruList.length === 0}
								>
									<SelectTrigger>
										<SelectValue
											placeholder={
												!selectedKelasId
													? "Pilih kelas dulu"
													: guruList.length === 0
														? "Belum ada guru aktif"
														: "Pilih guru..."
											}
										/>
									</SelectTrigger>
									<SelectContent>
										{guruList.map((guru) => (
											<SelectItem key={guru.id} value={guru.id}>
												{guru.name ?? "Tanpa nama"}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							{/* Pilih Murid */}
							<div className="space-y-1.5">
								<Label>Siswa</Label>
								<Select
									value={selectedMuridId}
									onValueChange={setSelectedMuridId}
									disabled={!selectedKelasId || muridList.length === 0}
								>
									<SelectTrigger>
										<SelectValue
											placeholder={
												!selectedKelasId
													? "Pilih kelas dulu"
													: muridList.length === 0
														? "Tidak ada siswa aktif"
														: "Pilih siswa..."
											}
										/>
									</SelectTrigger>
									<SelectContent>
										{muridList.map((murid) => (
											<SelectItem key={murid.id} value={murid.id}>
												{murid.namaLengkap}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							{/* Info terpilih */}
							{selectedMurid && selectedKelas && (
								<div className="bg-muted flex items-center gap-3 rounded-lg p-3">
									<CheckCircle2 className="text-primary h-4 w-4 shrink-0" />
									<div className="text-sm">
										<span className="font-semibold">
											{selectedMurid.namaLengkap}
										</span>
										<ChevronRight className="inline h-3 w-3 mx-1 text-muted-foreground" />
										<span className="text-muted-foreground">
											{kelasLabel || "Level belum dipilih"}
										</span>
										{selectedGuru && (
											<>
												<ChevronRight className="inline h-3 w-3 mx-1 text-muted-foreground" />
												<span className="text-muted-foreground">
													{selectedGuru.name}
												</span>
											</>
										)}
									</div>
								</div>
							)}
						</CardContent>
					</Card>

					{/* STEP 2: Level Laporan (independen dari kelas yang dipilih) */}
					<Card>
						<CardHeader className="pb-4">
							<CardTitle className="flex items-center gap-2 text-base">
								<span className="bg-primary text-primary-foreground flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold">
									2
								</span>
								Level Laporan
							</CardTitle>
							<CardDescription>
								Jenis & level yang akan tercetak di Final Report — boleh berbeda
								dari kelas aktif siswa di atas
							</CardDescription>
						</CardHeader>

						<CardContent className="space-y-4">
							{/* Pilih Jenis Kelas */}
							<div className="space-y-1.5">
								<Label>
									Jenis Kelas
									<span className="text-destructive ml-0.5">*</span>
								</Label>
								<Select
									value={selectedJenisKelasId}
									onValueChange={setSelectedJenisKelasId}
									disabled={loadingJenisKelas}
								>
									<SelectTrigger>
										<SelectValue
											placeholder={
												loadingJenisKelas
													? "Memuat jenis kelas..."
													: "Pilih jenis kelas..."
											}
										/>
									</SelectTrigger>
									<SelectContent>
										{jenisKelasList?.length === 0 && (
											<SelectItem value="_empty" disabled>
												Tidak ada jenis kelas
											</SelectItem>
										)}
										{jenisKelasList?.map((jenis) => (
											<SelectItem key={jenis.id} value={jenis.id}>
												{jenis.nama}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							{/* Pilih Level */}
							<div className="space-y-1.5">
								<Label>
									Level
									<span className="text-destructive ml-0.5">*</span>
								</Label>
								<Select value={selectedLevel} onValueChange={setSelectedLevel}>
									<SelectTrigger>
										<SelectValue placeholder="Pilih level..." />
									</SelectTrigger>
									<SelectContent>
										{["1", "2", "3", "4"].map((lvl) => (
											<SelectItem key={lvl} value={lvl}>
												Level {lvl}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							{kelasLabel && (
								<p className="text-muted-foreground text-xs">
									Akan tercetak sebagai:{" "}
									<span className="text-foreground font-medium">
										{kelasLabel}
									</span>
								</p>
							)}

							{/* Pilih Cabang — MANAGER wajib pilih, ADMIN otomatis dari cabangnya sendiri */}
							<div className="space-y-1.5">
								<Label>
									Cabang
									{isManagerCabang && (
										<span className="text-destructive ml-0.5">*</span>
									)}
								</Label>
								{isManagerCabang ? (
									<Select
										value={selectedCabangId}
										onValueChange={setSelectedCabangId}
										disabled={loadingCabang}
									>
										<SelectTrigger>
											<SelectValue
												placeholder={
													loadingCabang ? "Memuat cabang..." : "Pilih cabang..."
												}
											/>
										</SelectTrigger>
										<SelectContent>
											{cabangOptions?.map((cabang) => (
												<SelectItem key={cabang.id} value={cabang.id}>
													{cabang.namaCabang}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								) : (
									<div className="bg-muted text-muted-foreground rounded-md border px-3 py-2 text-sm">
										{loadingCabang
											? "Memuat cabang..."
											: (cabangOptions?.[0]?.namaCabang ??
												"Cabang tidak ditemukan")}
									</div>
								)}
								{!isManagerCabang && (
									<p className="text-muted-foreground text-xs">
										Otomatis diambil dari cabang akun Anda.
									</p>
								)}
							</div>
						</CardContent>
					</Card>

					{/* STEP 3: Nilai Tes */}
					<Card>
						<CardHeader className="pb-4">
							<CardTitle className="flex items-center gap-2 text-base">
								<span className="bg-primary text-primary-foreground flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold">
									3
								</span>
								Nilai Tes
							</CardTitle>
						</CardHeader>

						<CardContent className="space-y-4">
							<div className="grid grid-cols-2 gap-4">
								{[
									{ key: "midTest", label: "Mid Test" },
									{ key: "finalTest", label: "Final Test" },
								].map((field) => (
									<div key={field.key} className="space-y-1.5">
										<Label>
											{field.label}
											<span className="text-destructive ml-0.5">*</span>
										</Label>
										<Input
											type="number"
											min={0}
											max={100}
											placeholder="0 – 100"
											value={scores[field.key]}
											onChange={(e) =>
												handleScoreChange(field.key, e.target.value)
											}
										/>
									</div>
								))}
							</div>
						</CardContent>
					</Card>

					{/* STEP 4: Tipe Laporan */}
					<Card>
						<CardHeader className="pb-3">
							<CardTitle className="flex items-center gap-2 text-base">
								<span className="bg-primary text-primary-foreground flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold">
									4
								</span>
								Tipe Final Report
							</CardTitle>
							<CardDescription>
								Sesuaikan dengan jenis kelas yang diajar
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="flex gap-2">
								{(["4-aspek", "2-aspek"] as ReportType[]).map((type) => (
									<button
										key={type}
										type="button"
										onClick={() => setReportType(type)}
										className={cn(
											"rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
											reportType === type
												? "bg-primary text-primary-foreground border-primary"
												: "bg-background text-muted-foreground hover:bg-muted",
										)}
									>
										{type === "4-aspek" ? "4 Aspek" : "2 Aspek"}
									</button>
								))}
							</div>
							<p className="text-muted-foreground mt-2 text-xs">
								{reportType === "4-aspek"
									? "Final Score = (Listening + Speaking + Reading + Writing + Project) ÷ 5"
									: "Final Score = (Listening + Speaking + Project) ÷ 3"}
							</p>
						</CardContent>
					</Card>

					{/* STEP 5: English Skills */}
					<Card>
						<CardHeader className="pb-4">
							<CardTitle className="flex items-center gap-2 text-base">
								<span className="bg-primary text-primary-foreground flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold">
									5
								</span>
								English Skills
							</CardTitle>
						</CardHeader>

						<CardContent>
							<div className="grid grid-cols-2 gap-4">
								{skillFields.map((field) => (
									<div key={field.key} className="space-y-1.5">
										<Label>
											{field.label}
											<span className="text-destructive ml-0.5">*</span>
										</Label>
										<Input
											type="number"
											min={0}
											max={100}
											placeholder="0 – 100"
											value={scores[field.key]}
											onChange={(e) =>
												handleScoreChange(field.key, e.target.value)
											}
										/>
									</div>
								))}
							</div>
						</CardContent>
					</Card>

					{/* STEP 6: Project & Participation */}
					<Card>
						<CardHeader className="pb-4">
							<CardTitle className="flex items-center gap-2 text-base">
								<span className="bg-primary text-primary-foreground flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold">
									6
								</span>
								Project & Participation
							</CardTitle>
							<CardDescription>
								Skor dihitung otomatis dari recording dan kehadiran
							</CardDescription>
						</CardHeader>

						<CardContent className="space-y-4">
							<div className="space-y-1.5">
								<Label>
									Recording (0 – 4)
									<span className="text-destructive ml-0.5">*</span>
								</Label>
								<Select value={recording} onValueChange={setRecording}>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{RECORDING_OPTIONS.map((opt) => (
											<SelectItem key={opt.value} value={opt.value}>
												{opt.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							<div className="space-y-1.5">
								<div className="flex items-center justify-between">
									<Label>
										Kehadiran (maks. 23)
										<span className="text-destructive ml-0.5">*</span>
									</Label>
									{loadingAttendance && selectedMuridId && (
										<span className="text-muted-foreground flex items-center gap-1 text-xs">
											<Loader2 className="h-3 w-3 animate-spin" />
											Mengambil data...
										</span>
									)}
									{!loadingAttendance && attendanceData && selectedMuridId && (
										<span className="flex items-center gap-1 text-xs text-green-600">
											<Users className="h-3 w-3" />
											Otomatis dari absensi
										</span>
									)}
								</div>
								<Input
									type="number"
									min={0}
									max={23}
									placeholder="0 – 23"
									value={scores.attendance}
									onChange={(e) =>
										handleScoreChange("attendance", e.target.value)
									}
								/>
								{attendanceData && selectedMuridId && (
									<p className="text-muted-foreground text-xs">
										Hadir {attendanceData.hadirCount} dari{" "}
										{attendanceData.totalSesi} sesi. Bisa diedit manual jika
										perlu.
									</p>
								)}
							</div>

							<div className="bg-muted rounded-lg p-3 text-sm flex justify-between items-center">
								<span className="text-muted-foreground">
									Project & Participation (otomatis)
								</span>
								<span
									className={`font-bold text-base ${getScoreColor(projectParticipation)}`}
								>
									{projectParticipation}
								</span>
							</div>
						</CardContent>
					</Card>

					{/* STEP 7: Catatan */}
					<Card>
						<CardHeader className="pb-4">
							<CardTitle className="flex items-center gap-2 text-base">
								<span className="bg-primary text-primary-foreground flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold">
									7
								</span>
								Catatan
								<Badge variant="outline" className="text-xs font-normal">
									Opsional
								</Badge>
							</CardTitle>
						</CardHeader>

						<CardContent className="space-y-4">
							<div className="space-y-1.5">
								<Label>
									Tanggal Kelulusan
									<span className="text-destructive ml-0.5">*</span>
								</Label>
								<Popover
									open={graduationDateOpen}
									onOpenChange={setGraduationDateOpen}
								>
									<PopoverTrigger asChild>
										<Button
											variant="outline"
											className={cn(
												"w-full justify-start text-left font-normal",
												!graduationDate && "text-muted-foreground",
											)}
										>
											<CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
											{graduationDate
												? new Date(graduationDate).toLocaleDateString("id-ID", {
														day: "numeric",
														month: "long",
														year: "numeric",
													})
												: "Pilih tanggal kelulusan..."}
										</Button>
									</PopoverTrigger>
									<PopoverContent className="w-auto p-0" align="start">
										<Calendar
											mode="single"
											selected={
												graduationDate ? new Date(graduationDate) : undefined
											}
											onSelect={(date) => {
												if (!date) return;
												const y = date.getFullYear();
												const m = String(date.getMonth() + 1).padStart(2, "0");
												const d = String(date.getDate()).padStart(2, "0");
												setGraduationDate(`${y}-${m}-${d}`);
												setGraduationDateOpen(false);
											}}
											initialFocus
										/>
									</PopoverContent>
								</Popover>
								<p className="text-muted-foreground text-xs">
									Akan tampil di halaman sertifikat kelulusan PDF.
								</p>
							</div>

							<Textarea
								placeholder="Tambahkan catatan atau komentar tentang perkembangan siswa..."
								rows={3}
								value={notes}
								onChange={(e) => setNotes(e.target.value)}
							/>
						</CardContent>
					</Card>

					{/* SUBMIT */}
					<Button
						className="w-full"
						size="lg"
						onClick={handleSubmitClick}
						disabled={submitReport.isPending}
					>
						{submitReport.isPending ? (
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						) : (
							<Send className="mr-2 h-4 w-4" />
						)}
						Buat & Setujui Final Report
					</Button>
				</div>

				{/* KANAN: Ringkasan nilai */}
				<div className="space-y-5">
					<Card className="sticky top-6">
						<CardHeader className="pb-3">
							<CardTitle className="text-base">Ringkasan Nilai</CardTitle>
							{selectedMurid ? (
								<CardDescription>{selectedMurid.namaLengkap}</CardDescription>
							) : (
								<CardDescription className="text-muted-foreground/60 italic">
									Pilih siswa untuk melihat ringkasan
								</CardDescription>
							)}
						</CardHeader>

						<CardContent className="space-y-3">
							<div className="space-y-2">
								{[
									{ label: "Mid Test", value: n("midTest") },
									{ label: "Final Test", value: n("finalTest") },
								].map((item) => (
									<div
										key={item.label}
										className="flex justify-between text-sm"
									>
										<span className="text-muted-foreground">{item.label}</span>
										<span className="font-semibold">{item.value || "—"}</span>
									</div>
								))}
							</div>

							<div className="space-y-2">
								{skillFields.map((field) => {
									const val = n(field.key);
									return (
										<div
											key={field.key}
											className="flex justify-between text-sm"
										>
											<span className="text-muted-foreground">
												{field.label}
											</span>
											<span
												className={`font-semibold ${val ? getScoreColor(val) : ""}`}
											>
												{val || "—"}
											</span>
										</div>
									);
								})}
								<div className="flex justify-between text-sm">
									<span className="text-muted-foreground">Project & Part.</span>
									<span
										className={`font-semibold ${getScoreColor(projectParticipation)}`}
									>
										{projectParticipation}
									</span>
								</div>
							</div>

							<div className="rounded-xl bg-muted p-4 text-center">
								<p className="text-muted-foreground mb-1 text-xs uppercase tracking-wider">
									Final Score
								</p>
								<p
									className={`text-4xl font-black ${getScoreColor(finalScore)}`}
								>
									{finalScore}
								</p>
								<p
									className={`text-sm font-medium mt-1 ${getScoreColor(finalScore)}`}
								>
									{getDescription(finalScore)}
								</p>
							</div>

							<div className="text-muted-foreground/70 space-y-0.5 text-xs">
								<p>🟢 Excellent: 90–100</p>
								<p>🔵 Very Good: 80–89</p>
								<p>🟡 Good: 70–79</p>
								<p>🔴 Poor: &lt;70</p>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>

			{/* ── DIALOG KONFIRMASI SUBMIT ──────────────────── */}
			<AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle className="flex items-center gap-2">
							<Send className="h-5 w-5" />
							Buat Final Report?
						</AlertDialogTitle>
						<AlertDialogDescription asChild>
							<div className="space-y-2">
								<p>
									Laporan ini akan langsung berstatus{" "}
									<span className="font-semibold text-foreground">
										APPROVED
									</span>{" "}
									karena dibuat oleh Admin/Manager.
								</p>
								{selectedMurid && (
									<div className="rounded-lg border p-3 text-sm space-y-1">
										<p>
											<span className="text-muted-foreground">Siswa: </span>
											<span className="font-semibold">
												{selectedMurid.namaLengkap}
											</span>
										</p>
										<p>
											<span className="text-muted-foreground">Kelas: </span>
											<span className="font-semibold">{kelasLabel}</span>
										</p>
										<p>
											<span className="text-muted-foreground">Guru: </span>
											<span className="font-semibold">
												{selectedGuru?.name}
											</span>
										</p>
										<p>
											<span className="text-muted-foreground">Cabang: </span>
											<span className="font-semibold">
												{cabangOptions?.find((c) => c.id === selectedCabangId)
													?.namaCabang ?? "-"}
											</span>
										</p>
										<p>
											<span className="text-muted-foreground">
												Final Score:{" "}
											</span>
											<span
												className={`font-bold ${getScoreColor(finalScore)}`}
											>
												{finalScore} ({getDescription(finalScore)})
											</span>
										</p>
									</div>
								)}
							</div>
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={submitReport.isPending}>
							Batal
						</AlertDialogCancel>
						<Button
							onClick={handleConfirmSubmit}
							disabled={submitReport.isPending}
						>
							{submitReport.isPending ? (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							) : (
								<Send className="mr-2 h-4 w-4" />
							)}
							Ya, Buat & Setujui
						</Button>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
