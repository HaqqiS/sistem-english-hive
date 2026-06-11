import {
	Document,
	Image,
	Page,
	StyleSheet,
	Text,
	View,
} from "@react-pdf/renderer";
import { LOGO_BASE64 } from "@/utils/logo-base64";

const PAGE_PADDING_H = 40;
const TABLE_MARGIN_H = 130;

const styles = StyleSheet.create({
	page: {
		paddingTop: 30,
		paddingBottom: 40,
		paddingHorizontal: PAGE_PADDING_H,
		fontSize: 11,
		fontFamily: "Helvetica",
		color: "#000000",
		backgroundColor: "#ffffff",
	},

	// ── HEADER (Diperbaiki agar flexbox bekerja sempurna tanpa absolute) ──
	header: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center", // Menyeimbangkan tinggi logo dan teks alamat
		marginBottom: 14,
	},
	logo: {
		width: 130, // Menggunakan ukuran dari placeholder kamu sebelumnya
		height: 48,
		objectFit: "contain",
	},
	addressBlock: {
		width: 250, // Sedikit dilebarkan agar teks alamat panjang tidak terpotong
		textAlign: "right",
		fontSize: 9,
		lineHeight: 1.5,
		color: "#333333",
	},
	addressCabang: {
		fontSize: 10,
		fontFamily: "Helvetica-Bold",
		color: "#000000",
		marginBottom: 2,
	},

	// ── DIVIDER ──────────────────────────────────────
	divider: {
		borderBottomWidth: 1.5,
		borderBottomColor: "#000000",
		marginBottom: 16,
	},

	// ── TITLE ─────────────────────────────────────────
	titleContainer: {
		alignItems: "center",
		marginBottom: 14,
	},
	title: {
		fontSize: 14,
		fontFamily: "Helvetica-Bold",
		letterSpacing: 0.5,
	},

	// ── STUDENT INFO ─────────────────────────────────
	studentInfo: {
		alignItems: "center",
		marginBottom: 16,
	},
	studentName: {
		fontSize: 11,
		fontFamily: "Helvetica-Bold",
		textAlign: "center",
	},
	studentLevel: {
		fontSize: 11,
		fontFamily: "Helvetica-Bold",
		textAlign: "center",
	},

	// ── TABLE WRAPPER ─────────────────────────────────
	tableWrapper: {
		paddingHorizontal: TABLE_MARGIN_H,
		marginBottom: 8,
	},

	// ── TABLE ─────────────────────────────────────────
	table: {
		borderWidth: 1,
		borderColor: "#000000",
	},
	tableRowHeader: {
		flexDirection: "row",
		backgroundColor: "#ffffff",
		borderBottomWidth: 1,
		borderBottomColor: "#000000",
	},
	tableRow: {
		flexDirection: "row",
		borderBottomWidth: 1,
		borderBottomColor: "#000000",
	},
	tableRowFinal: {
		flexDirection: "row",
		backgroundColor: "#ffffff",
	},
	cellSkill: {
		width: "45%",
		padding: "5 8",
		borderRightWidth: 1,
		borderRightColor: "#000000",
	},
	cellScore: {
		width: "20%",
		padding: "5 8",
		textAlign: "center",
		borderRightWidth: 1,
		borderRightColor: "#000000",
	},
	cellDesc: {
		width: "35%",
		padding: "5 8",
		textAlign: "center",
	},
	headerText: {
		fontFamily: "Helvetica-Bold",
		fontSize: 11,
		textAlign: "center",
	},
	cellText: { fontSize: 11 },
	cellTextBold: { fontSize: 11, fontFamily: "Helvetica-Bold" },
	cellTextCenter: { fontSize: 11, textAlign: "center" },
	cellTextCenterBold: {
		fontSize: 11,
		textAlign: "center",
		fontFamily: "Helvetica-Bold",
	},

	// ── SCORE RANGE ───────────────────────────────────
	scoreRangeWrapper: {
		paddingHorizontal: TABLE_MARGIN_H,
		marginBottom: 24,
	},
	scoreRangeRow: {
		flexDirection: "row",
	},
	scoreRangeLabel: {
		fontFamily: "Helvetica-Bold",
		fontSize: 10,
	},
	scoreRangeText: {
		fontSize: 10,
	},

	// ── SIGNATURE ─────────────────────────────────────
	signatureSection: {
		alignItems: "center",
		marginTop: 8,
	},
	signatureLabel: {
		fontSize: 11,
		marginBottom: 40,
	},
	signatureName: {
		fontSize: 11,
	},
});

// ── STYLES PAGE 2: CERTIFICATE ──────────────────────────────────────────────
// Layout mengikuti template Word: A4 Landscape, margin 1in semua sisi
// Teks ada di kanan halaman (x ~344pt dari content left), rata tengah dalam group ~395pt lebar
const certStyles = StyleSheet.create({
	page: {
		// A4 Landscape: 841.89 x 595.28pt, padding = margin dokumen (72pt = 1in)
		paddingTop: 72,
		paddingBottom: 72,
		paddingLeft: 72,
		paddingRight: 72,
		fontFamily: "Helvetica",
		backgroundColor: "#ffffff",
	},
	// Wrapper absolut untuk seluruh group teks
	group: {
		position: "absolute",
		// Group dari kiri content: 344pt, dari atas page (termasuk padding): 72 + 96.8 = 168.8pt
		left: 420,
		top: 168,
		width: 395,
	},
	// Text box 1: Nama siswa
	nama: {
		width: 395,
		textAlign: "center",
		fontFamily: "Helvetica-Bold",
	},
	// Text box 2: Level (y=143pt dari top group)
	level: {
		position: "absolute",
		top: 143,
		width: 395,
		textAlign: "center",
		fontFamily: "Helvetica-Bold",
		fontSize: 24,
	},
	// Text box 3: Lokasi + tanggal (y=216pt dari top group)
	tanggal: {
		position: "absolute",
		top: 216,
		width: 395,
		textAlign: "center",
		fontFamily: "Helvetica",
		fontSize: 11,
	},
});

function getNameFontSize(name: string): number {
	const len = name.length;
	if (len <= 20) return 22;
	if (len <= 28) return 18;
	if (len <= 36) return 15;
	return 12;
}

function formatLevel(level: string): string {
	// "TinyTods Level 1" → "TINY TODS 1"
	// "Little Star Level 3" → "LITTLE STAR 3"
	return level
		.replace(/\blevel\b/gi, "") // hapus kata "Level"
		.replace(/\s+/g, " ") // normalkan spasi ganda
		.trim()
		.toUpperCase();
}

function formatGraduationDate(d?: Date | string | null): string {
	if (!d) return "";
	const date = typeof d === "string" ? new Date(d) : d;
	const months = [
		"JANUARY",
		"FEBRUARY",
		"MARCH",
		"APRIL",
		"MAY",
		"JUNE",
		"JULY",
		"AUGUST",
		"SEPTEMBER",
		"OCTOBER",
		"NOVEMBER",
		"DECEMBER",
	];
	return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

function getDescription(score: number) {
	if (score >= 90) return "Excellent";
	if (score >= 80) return "Very good";
	if (score >= 70) return "Good";
	return "Poor";
}

export interface FinalReportData {
	studentName: string;
	teacherName: string;
	level: string;
	listening: number;
	speaking: number;
	reading: number;
	writing: number;
	projectParticipation: number;
	finalScore: number;
	notes?: string | null;
	createdAt?: Date | string | null;
	cabangNama?: string | null;
	cabangAlamat?: string | null;
	cabangNoTelp?: string | null;
	cabangEmail?: string | null;
	graduationDate?: Date | string | null;
}

interface Props {
	data: FinalReportData;
}

export function FinalReportPDF({ data }: Props) {
	const assessments = [
		{ label: "Listening", score: data.listening },
		{ label: "Speaking", score: data.speaking },
		{ label: "Reading", score: data.reading },
		{ label: "Writing", score: data.writing },
		{ label: "Project & Participation", score: data.projectParticipation },
	];

	const namaCabang = data.cabangNama ?? "";
	const alamat = data.cabangAlamat ?? "";
	const noTelp = data.cabangNoTelp ?? "";
	const email = data.cabangEmail ?? "";

	// PENTING: Ubah ekstensi gambar ke .png di server kamu agar aman dibaca PDF engine
	const logoUrl = LOGO_BASE64;

	return (
		<Document>
			<Page size="A4" orientation="landscape" style={styles.page}>
				{/* HEADER (Struktur bersih & kokoh) */}
				<View style={styles.header}>
					{/* Logo diletakkan langsung di dalam flex row */}
					<Image src={logoUrl} style={styles.logo} />

					{/* Alamat otomatis terdorong ke kanan karena justifyContent: space-between */}
					<View style={styles.addressBlock}>
						{namaCabang ? (
							<Text style={styles.addressCabang}>{namaCabang}</Text>
						) : null}
						{alamat ? <Text>{alamat}</Text> : null}
						{noTelp ? <Text>Phone: {noTelp}</Text> : null}
						{email ? <Text>Email: {email}</Text> : null}
					</View>
				</View>

				{/* DIVIDER */}
				<View style={styles.divider} />

				{/* TITLE */}
				<View style={styles.titleContainer}>
					<Text style={styles.title}>STUDENT'S FINAL REPORT</Text>
				</View>

				{/* STUDENT INFO */}
				<View style={styles.studentInfo}>
					<Text style={styles.studentName}>Name : {data.studentName}</Text>
					<Text style={styles.studentLevel}>Level : {data.level}</Text>
				</View>

				{/* TABLE */}
				<View style={styles.tableWrapper}>
					<View style={styles.table}>
						{/* Header */}
						<View style={styles.tableRowHeader}>
							<View style={styles.cellSkill}>
								<Text style={styles.headerText}>English Skills</Text>
							</View>
							<View style={styles.cellScore}>
								<Text style={styles.headerText}>Score</Text>
							</View>
							<View style={styles.cellDesc}>
								<Text style={styles.headerText}>Description</Text>
							</View>
						</View>

						{/* Skill rows — skip kalau nilai 0 */}
						{assessments
							.filter((item) => item.score !== 0)
							.map((item) => (
								<View key={item.label} style={styles.tableRow}>
									<View style={styles.cellSkill}>
										<Text style={styles.cellText}>{item.label}</Text>
									</View>
									<View style={styles.cellScore}>
										<Text style={styles.cellTextCenter}>{item.score}</Text>
									</View>
									<View style={styles.cellDesc}>
										<Text style={styles.cellTextCenter}>
											{getDescription(item.score)}
										</Text>
									</View>
								</View>
							))}

						{/* Final Score row — skip kalau nilai 0 */}
						{data.finalScore !== 0 && (
							<View style={styles.tableRowFinal}>
								<View style={styles.cellSkill}>
									<Text style={styles.cellTextBold}>FINAL SCORE</Text>
								</View>
								<View style={styles.cellScore}>
									<Text style={styles.cellTextCenterBold}>
										{data.finalScore}
									</Text>
								</View>
								<View style={styles.cellDesc}>
									<Text style={styles.cellTextCenter}>
										{getDescription(data.finalScore)}
									</Text>
								</View>
							</View>
						)}
					</View>
				</View>

				{/* SCORE RANGE */}
				<View style={styles.scoreRangeWrapper}>
					<View style={styles.scoreRangeRow}>
						<Text style={styles.scoreRangeLabel}>Score Range: </Text>
						<Text style={styles.scoreRangeText}>
							Excellent (90-100); Very good (80-89); Good (70-79); Poor (60-69)
						</Text>
					</View>
				</View>

				{/* SIGNATURE */}
				<View style={styles.signatureSection}>
					<Text style={styles.signatureLabel}>Classroom Teacher,</Text>
					<Text style={styles.signatureName}>{data.teacherName}</Text>
				</View>
			</Page>
			{/* ── PAGE 2: CERTIFICATE — layout persis mengikuti template Word ── */}
			<Page size="A4" orientation="landscape" style={certStyles.page}>
				{/*
				  Group teks diposisikan absolut persis seperti di Word:
				  - left: 420pt dari margin kiri
				  - top:  168pt dari atas halaman (margin 72pt + posV 96.8pt)
				  Dalam group, 3 text box:
				    1. Nama  — y=0,   Century Gothic Bold 22pt, center
				    2. Level — y=143, Century Gothic Bold 24pt, center
				    3. Tanggal — y=216, Arial 11pt, center
				*/}
				<View style={certStyles.group}>
					{/* Text Box 1: Nama Siswa */}
					<Text
						style={{
							...certStyles.nama,
							fontSize: getNameFontSize(data.studentName),
						}}
					>
						{data.studentName.toUpperCase()}
					</Text>

					{/* Text Box 2: Level */}
					<Text style={certStyles.level}>{formatLevel(data.level)}</Text>

					{/* Text Box 3: Lokasi + Tanggal Kelulusan */}
					{data.graduationDate ? (
						<Text style={certStyles.tanggal}>
							{data.cabangNama ? `${data.cabangNama.toUpperCase()}, ` : ""}
							{formatGraduationDate(data.graduationDate)}
						</Text>
					) : null}
				</View>
			</Page>
		</Document>
	);
}
