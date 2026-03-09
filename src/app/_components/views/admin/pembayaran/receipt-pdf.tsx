import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { format } from "date-fns";
import { id } from "date-fns/locale";

// Define styles for the PDF
const styles = StyleSheet.create({
	page: {
		padding: 40,
		fontSize: 10,
		fontFamily: "Helvetica",
		color: "#333",
	},
	header: {
		flexDirection: "row",
		justifyContent: "space-between",
		marginBottom: 30,
		borderBottom: "2px solid #009F86",
		paddingBottom: 15,
	},
	brand: {
		fontSize: 24,
		fontWeight: "bold",
		color: "#009F86",
		letterSpacing: 1,
	},
	brandSub: {
		fontSize: 10,
		color: "#64748b",
		marginTop: 4,
	},
	receiptTitleContainer: {
		alignItems: "flex-end",
	},
	receiptTitle: {
		fontSize: 20,
		fontWeight: "bold",
		color: "#1e293b",
		marginBottom: 4,
	},
	receiptDate: {
		color: "#64748b",
	},
	infoSection: {
		flexDirection: "row",
		justifyContent: "space-between",
		marginBottom: 30,
		backgroundColor: "#f8fafc",
		padding: 15,
		borderRadius: 6,
	},
	infoLabel: {
		color: "#64748b",
		fontSize: 9,
		textTransform: "uppercase",
	},
	infoValue: {
		fontWeight: "bold",
		fontSize: 11,
		color: "#0f172a",
	},
	table: {
		width: "100%",
		marginBottom: 20,
	},
	tableHeader: {
		flexDirection: "row",
		backgroundColor: "#f1f5f9",
		borderBottom: "1px solid #cbd5e1",
		paddingVertical: 8,
		paddingHorizontal: 12,
		fontWeight: "bold",
		color: "#334155",
	},
	tableRow: {
		flexDirection: "row",
		borderBottom: "1px solid #e2e8f0",
		paddingVertical: 12,
		paddingHorizontal: 12,
	},
	colNo: { width: "5%" },
	colClass: { width: "50%" },
	colDesc: { width: "15%" },
	colType: { width: "10%" },
	colAmount: { width: "20%", textAlign: "right" },
	totalSection: {
		flexDirection: "row",
		justifyContent: "flex-end",
		marginTop: 10,
		paddingTop: 10,
	},
	totalLabel: {
		fontSize: 12,
		fontWeight: "bold",
		marginRight: 20,
		color: "#334155",
	},
	totalAmount: {
		fontSize: 14,
		fontWeight: "bold",
		color: "#009F86",
		width: "20%",
		textAlign: "right",
		paddingRight: 12,
	},
	footer: {
		position: "absolute",
		bottom: 40,
		left: 40,
		right: 40,
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "flex-end",
	},
	signatures: {
		alignItems: "center",
		width: 150,
	},
	signatureLine: {
		borderBottom: "1px solid #94a3b8",
		width: "100%",
		marginBottom: 4,
	},
	signatureName: {
		fontWeight: "bold",
	},
	footerText: {
		color: "#94a3b8",
		fontSize: 8,
		textAlign: "center",
		marginTop: 20,
	},
});

export interface ReceiptItem {
	id: string;
	judul: string;
	kodeKelas?: string;
	kategori: string;
	jumlah: number;
	tanggalBayar: Date | null | undefined;
}

interface ReceiptPDFProps {
	items: ReceiptItem[];
	namaMurid: string;
	cabangName: string;
	adminName: string;
}

function formatRupiah(amount: number) {
	return new Intl.NumberFormat("id-ID", {
		style: "currency",
		currency: "IDR",
		minimumFractionDigits: 0,
	}).format(amount);
}

export function ReceiptPDF({
	items,
	namaMurid,
	cabangName,
	adminName,
}: ReceiptPDFProps) {
	const totalAmount = items.reduce((sum, item) => sum + item.jumlah, 0);
	const todayDate = format(new Date(), "dd MMMM yyyy", { locale: id });
	const receiptNumber = `INV-${format(new Date(), "yyyyMMdd")}-${Math.floor(
		Math.random() * 1000,
	)
		.toString()
		.padStart(3, "0")}`;

	return (
		<Document>
			<Page size="A4" style={styles.page}>
				{/* Header */}
				<View style={styles.header}>
					<View>
						<Text style={styles.brand}>ENGLISH HIVE</Text>
						<Text style={styles.brandSub}>Cabang: {cabangName}</Text>
					</View>
					<View style={styles.receiptTitleContainer}>
						<Text style={styles.receiptTitle}>KUITANSI</Text>
						<Text style={styles.receiptDate}>{receiptNumber}</Text>
					</View>
				</View>

				{/* Info Section */}
				<View style={styles.infoSection}>
					<View style={{ flexDirection: "column", gap: 4 }}>
						<Text style={styles.infoLabel}>Diterima Dari</Text>
						<Text style={styles.infoValue}>{namaMurid}</Text>
					</View>

					<View style={{ flexDirection: "column", gap: 4 }}>
						<Text style={styles.infoLabel}>Tanggal Cetak</Text>
						<Text style={styles.infoValue}>{todayDate}</Text>
					</View>
				</View>

				{/* Table */}
				<View style={styles.table}>
					<View style={styles.tableHeader}>
						<Text style={styles.colNo}>No.</Text>
						<Text style={styles.colClass}>Kelas</Text>
						<Text style={styles.colDesc}>Keterangan</Text>
						<Text style={styles.colType}>Kategori</Text>
						<Text style={styles.colAmount}>Jumlah</Text>
					</View>

					{items.map((item, index) => (
						<View style={styles.tableRow} key={item.id}>
							<Text style={styles.colNo}>{index + 1}</Text>
							<Text style={styles.colClass}>{item.kodeKelas || "-"}</Text>
							<View style={styles.colDesc}>
								<Text
									style={{
										fontWeight: "bold",
										color: "#1e293b",
										marginBottom: 2,
									}}
								>
									{item.judul}
								</Text>
							</View>
							<Text style={styles.colType}>{item.kategori}</Text>
							<Text style={styles.colAmount}>{formatRupiah(item.jumlah)}</Text>
						</View>
					))}

					{/* Total */}
					<View style={styles.totalSection}>
						<Text style={styles.totalLabel}>TOTAL PEMBAYARAN</Text>
						<Text style={styles.totalAmount}>{formatRupiah(totalAmount)}</Text>
					</View>
				</View>

				{/* Footer / Signatures */}
				<View style={styles.footer}>
					<View>
						<Text style={styles.footerText}>
							Terima kasih atas pembayaran Anda.
						</Text>
						<Text style={styles.footerText}>
							Dokumen ini sah dicetak oleh sistem secara otomatis.
						</Text>
					</View>
					<View style={styles.signatures}>
						<Text style={{ marginBottom: 40, fontSize: 10, color: "#64748b" }}>
							Penerima (Admin)
						</Text>
						<View style={styles.signatureLine} />
						<Text style={styles.signatureName}>{adminName || "Admin"}</Text>
					</View>
				</View>
			</Page>
		</Document>
	);
}
