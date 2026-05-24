import {
	Document,
	Image,
	Page,
	StyleSheet,
	Text,
	View,
} from "@react-pdf/renderer";

const PAGE_PADDING_H = 40;
const TABLE_MARGIN_H = 30;

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
		backgroundColor: "#d0d0d0",
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
		backgroundColor: "#f0f0f0",
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
	const logoUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/logo_header.png`;

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
					<Text style={styles.studentLevel}>Level: {data.level}</Text>
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

						{/* Skill rows */}
						{assessments.map((item) => (
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

						{/* Final Score row */}
						<View style={styles.tableRowFinal}>
							<View style={styles.cellSkill}>
								<Text style={styles.cellTextBold}>FINAL SCORE</Text>
							</View>
							<View style={styles.cellScore}>
								<Text style={styles.cellTextCenterBold}>{data.finalScore}</Text>
							</View>
							<View style={styles.cellDesc}>
								<Text style={styles.cellTextCenter}>
									{getDescription(data.finalScore)}
								</Text>
							</View>
						</View>
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
		</Document>
	);
}
