import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "sonner";
import type { TypeScheduleMatrixItem } from "@/types/jadwalKelas.type";

interface ClassInfo {
	kodeKelas?: string;
	level: number;
	grup: string | null;
	bulanTahun: string;
	pengajar?: string;
	jadwal?: string;
}

interface StudentData {
	namaMurid: string;
	status?: string;
}

export const exportAbsensiPDF = (
	classInfo: ClassInfo,
	students: StudentData[],
) => {
	if (!students || students.length === 0) {
		toast.error("Tidak ada data murid untuk diexport");
		return;
	}

	const doc = new jsPDF({ orientation: "landscape" });

	// === CONFIG ===
	// let currentY = 20;

	// === HEADER: INFORMASI KELAS ===
	// Layout:
	// Kelas   : {kodeKelas}
	// Teacher : {pengajar}
	// Jadwal  : {jadwal}

	doc.setFontSize(10);
	doc.setFont("helvetica", "bold");

	// We use autoTable for the header to keep alignment clean, similar to before but updated fields
	autoTable(doc, {
		// startY: currentY,
		body: [
			["Kelas", `: ${classInfo.kodeKelas || "-"}`],
			["Teacher", `: ${classInfo.pengajar || "-"}`],
			["Jadwal", `: ${classInfo.jadwal || "-"}`],
		],
		theme: "plain", // Clean look without borders for info section
		styles: {
			fontSize: 12,
			cellPadding: 1,
			fontStyle: "bold",
		},
		columnStyles: {
			0: { cellWidth: 25 }, // Label width
			1: { cellWidth: "auto" }, // Value width
		},
		margin: { left: 14, right: 14, top: 25 },
	});

	// currentY = (doc as any).lastAutoTable.finalY + 5;

	// === TABLE: DAFTAR MURID (1-24 Columns) ===

	// 1. Generate Header ROWs
	// Row 1: NO (RowSpan 2), NAMA (RowSpan 2), 1...24
	// Row 2: Empty cells for Dates
	// biome-ignore lint/suspicious/noExplicitAny: library specific format
	const headerRow1: any[] = [
		{ content: "NO", rowSpan: 2, styles: { valign: "middle" } },
		{ content: "NAMA", rowSpan: 2, styles: { valign: "middle" } },
	];
	for (let i = 1; i <= 24; i++) {
		headerRow1.push(i.toString());
	}

	const headerRow2: string[] = [];
	for (let i = 1; i <= 24; i++) {
		headerRow2.push(""); // Row untuk tanggal
	}

	// 2. Generate Body Rows
	const tableBody = students.map((s, index) => {
		const row = [
			(index + 1).toString(),
			s.namaMurid,
			...Array(24).fill(""), // 24 Empty cells for checklist
		];
		return row;
	});

	// 3. Define Column Styles
	// Col 0 (NO): small
	// Col 1 (NAMA): wide
	// Cols 2-25 (1-24): equal small width
	const columnStyles: Record<
		number,
		{ cellWidth?: number | "auto"; halign?: "center" | "left" }
	> = {
		0: { cellWidth: 10, halign: "center" },
		1: { cellWidth: 60, halign: "left" }, // Nama takes remaining relevant space or fixed wide
	};

	// Assign style for 1-24 columns
	for (let i = 2; i < 26; i++) {
		columnStyles[i] = { cellWidth: 8, halign: "center" }; // Small square-ish cells
	}

	autoTable(doc, {
		// startY: currentY,
		head: [headerRow1, headerRow2],
		body: tableBody,
		theme: "grid",
		headStyles: {
			fillColor: [255, 255, 255],
			textColor: 0,
			fontStyle: "bold",
			lineWidth: 0.1,
			lineColor: 0,
			halign: "center",
			valign: "middle",
		},
		styles: {
			fontSize: 11,
			cellPadding: 2,
			lineColor: 0,
			lineWidth: 0.1,
			valign: "middle",
			textColor: 0,
		},
		columnStyles: columnStyles,
		margin: { left: 14, right: 14 },
	});

	// Save
	const safeName = (classInfo.kodeKelas || "Kelas")
		.replace(/[^a-zA-Z0-9]+/g, "-") // Replace non-alphanum with single dash
		.replace(/^-+|-+$/g, ""); // Trim dashes
	doc.save(`Absensi-${safeName}.pdf`);
};

export const exportJadwalMatrixPDF = (
	dataPages: {
		hari: string;
		scheduleMap: Record<string, Record<string, TypeScheduleMatrixItem[]>>;
	}[],
	rooms: { id: string; namaRuang: string }[],
	timeSlots: string[],
) => {
	if (!timeSlots.length || !rooms.length || !dataPages.length) {
		toast.error("Tidak ada data jadwal untuk diexport");
		return;
	}

	const doc = new jsPDF({ orientation: "landscape" });

	dataPages.forEach((pageData, pageIndex) => {
		if (pageIndex > 0) doc.addPage();

		const { hari, scheduleMap } = pageData;
		const currentY = 15;

		// TITLE
		doc.setFontSize(14);
		doc.setFont("helvetica", "bold");
		doc.setTextColor(0, 0, 0); // Reset color
		doc.text(`JADWAL KELAS - HARI ${hari}`, 14, 10);
		doc.setFontSize(8);
		doc.setFont("helvetica", "normal");
		doc.text(`Dicetak pada: ${new Date().toLocaleString()}`, 14, currentY);

		// HEADERS
		const head = [["WAKTU", ...rooms.map((r) => r.namaRuang)]];

		// BODY
		// Determine time slots DYNAMICALLY for this page/day only
		const pageTimeSlots = Object.keys(scheduleMap).sort();

		const body = pageTimeSlots.map((time) => {
			const row: (
				| string
				| { content: string; raw: TypeScheduleMatrixItem[] }
			)[] = [time]; // First col is Time
			rooms.forEach((room) => {
				const schedules = scheduleMap[time]?.[room.id] || [];
				if (schedules.length > 0) {
					// Phantom text for auto-height calculation
					// We use font size 10 in styles, so this should reserve enough space.
					const phantomTexts = schedules.map((schedule) => {
						const teacher = schedule.guru || "-";
						const status = `(${schedule.statusKelas || "-"})`;
						const murid = schedule.jumlahMurid
							? ` • ${schedule.jumlahMurid} Murid`
							: "";

						// Combine Status and Murid on same line for height calculation matches visual
						const statusLine = status + murid;

						return [
							schedule.kodeKelas,
							teacher,
							"", // Spacer
							`${schedule.jamMulai} - ${schedule.jamSelesai}`,
							statusLine,
							schedule.deskripsi || "",
						].join("\n");
					});

					row.push({
						content: phantomTexts.join("\n\n---\n\n"),
						raw: schedules,
					});
				} else {
					row.push("");
				}
			});
			return row;
		});

		autoTable(doc, {
			startY: currentY + 5,
			head: head,
			body: body,
			theme: "grid",
			styles: {
				fontSize: 10, // Use 10 to ensure height calculation fits our manual text
				textColor: 255, // White text (invisible) so we can paint over it
				cellPadding: 2,
				lineColor: [200, 200, 200],
				lineWidth: 0.1,
				valign: "top",
				// minCellHeight: 45, // Removed to allow auto-height
			},
			headStyles: {
				fillColor: [40, 40, 40],
				textColor: 255,
				fontStyle: "bold",
				halign: "center",
				valign: "middle",
				minCellHeight: 0,
			},
			columnStyles: {
				0: {
					fontStyle: "bold",
					cellWidth: 20,
					halign: "center",
					valign: "middle",
					textColor: 50, // Restore visible time column text
				},
			},
			didDrawCell: (data) => {
				const { cell, doc } = data;
				// Check if this is a body cell and not the first column (time)
				if (
					data.section === "body" &&
					data.column.index > 0 &&
					cell.raw &&
					// biome-ignore lint/suspicious/noExplicitAny: library
					(cell.raw as any).raw
				) {
					// biome-ignore lint/suspicious/noExplicitAny: library
					const schedules = (cell.raw as any).raw as TypeScheduleMatrixItem[];

					// Current Y in cell
					let cellCurrentY = cell.y;

					schedules.forEach((schedule, index) => {
						// Add separator lines if multiple schedules
						if (index > 0) {
							doc.setDrawColor(200, 200, 200);
							doc.setLineWidth(0.1);
							doc.line(
								cell.x + 2,
								cellCurrentY,
								cell.x + cell.width - 2,
								cellCurrentY,
							);
							cellCurrentY += 4;
						}

						// COLORS
						const DEFAULT_COLOR: [number, number, number] = [156, 163, 175]; // Grey
						const STATUS_COLORS: Record<string, [number, number, number]> = {
							RUNNING: [37, 99, 235], // Blue
							TRIAL: [168, 85, 247], // Purple
							WAITING: [234, 179, 8], // Yellow
							LEVEL_UP: [20, 184, 166], // Teal
							COMPLETED: [100, 116, 139], // Slate
							DEFAULT: DEFAULT_COLOR,
						};

						const statusColor =
							STATUS_COLORS[schedule.statusKelas || "DEFAULT"] ?? DEFAULT_COLOR;

						// LAYOUT VARS
						const padding = 2;
						const xBase = cell.x + padding;
						let currentTextY = cellCurrentY + padding + 3; // Initial offset for first line
						const contentWidth = cell.width - padding * 2;

						// 1. STATUS STRIP (Left Border) - Per schedule
						doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);

						// Determine height for this schedule block roughly
						// This is a bit estimated, but good enough for PDF
						const blockHeight = 25; // Approximate height per block

						doc.rect(cell.x, cellCurrentY, 1.5, blockHeight, "F");

						// Adjust xBase to not overlap with strip
						const xText = xBase + 2;
						const maxTextWidth = contentWidth - 2;

						// 2. KODE KELAS
						doc.setFont("helvetica", "bold");
						doc.setFontSize(10);
						doc.setTextColor(30, 30, 30);

						const kodeLines = doc.splitTextToSize(
							schedule.kodeKelas,
							maxTextWidth,
						);
						doc.text(kodeLines, xText, currentTextY);
						currentTextY += kodeLines.length * 4;

						// 3. GURU
						const teacherName = schedule.guru || "-";
						const teacherColor = stringToColor(teacherName);

						doc.setFont("helvetica", "normal");
						doc.setFontSize(9);
						doc.setTextColor(teacherColor[0], teacherColor[1], teacherColor[2]);

						const teacherLines = doc.splitTextToSize(teacherName, maxTextWidth);
						doc.text(teacherLines, xText, currentTextY);
						currentTextY += teacherLines.length * 3.5;

						currentTextY += 1;

						// 4. JAM
						doc.setFontSize(8);
						doc.setTextColor(100, 100, 100);
						doc.text(
							`${schedule.jamMulai} - ${schedule.jamSelesai}`,
							xText,
							currentTextY,
						);
						currentTextY += 3.5;

						// 5. STATUS PILL
						doc.setFont("helvetica", "bold");
						doc.setFontSize(7.5);
						doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
						doc.text(schedule.statusKelas || "-", xText, currentTextY);

						// 6. MURID COUNT
						if (schedule.jumlahMurid) {
							doc.setTextColor(80, 80, 80);
							doc.setFont("helvetica", "normal");
							doc.text(
								` • ${schedule.jumlahMurid} Murid`,
								xText + doc.getTextWidth(schedule.statusKelas || "-"),
								currentTextY,
							);
						}

						// 7. DESKRIPSI
						if (schedule.deskripsi) {
							currentTextY += 3.5;
							doc.setFont("helvetica", "normal");
							doc.setFontSize(7);
							doc.setTextColor(100, 100, 100);

							const descLines = doc.splitTextToSize(
								schedule.deskripsi,
								maxTextWidth,
							);
							doc.text(descLines, xText, currentTextY);
							currentTextY += descLines.length * 3.5;
						}

						// Update cellCurrentY for next schedule
						cellCurrentY = currentTextY + 2;
					});
				}
			},
			margin: { left: 10, right: 10 },
			rowPageBreak: "avoid",
		});
	});

	const dateStr = new Date().toISOString().split("T")[0];
	const fileName =
		dataPages.length > 1
			? `Jadwal-FULL-${dateStr}.pdf`
			: `Jadwal-${dataPages[0]?.hari ?? "UNKNOWN"}-${dateStr}.pdf`;

	doc.save(fileName);
};

// Helper: Generate consistent color from string
function stringToColor(str: string): [number, number, number] {
	let hash = 0;
	if (str.length === 0 || str === "Belum ada guru") return [100, 100, 100]; // Default grey for empty or placeholder

	// Improved DJB2 Hash for better distribution with short strings
	for (let i = 0; i < str.length; i++) {
		hash = (hash << 5) - hash + str.charCodeAt(i);
		hash |= 0; // Convert to 32bit integer
	}

	// Add some mixing to properly scatter close strings like "Nala" and "Nova"
	// MurmurHash3 fmix32 style finalizer
	hash ^= hash >>> 16;
	hash = Math.imul(hash, 0x85ebca6b);
	hash ^= hash >>> 13;
	hash = Math.imul(hash, 0xc2b2ae35);
	hash ^= hash >>> 16;

	// Enhanced Palette (20+ Colors)
	const PALETTE: [number, number, number][] = [
		[220, 38, 38], // Red 600
		[234, 88, 12], // Orange 600
		[217, 119, 6], // Amber 600
		[22, 163, 74], // Green 600
		[13, 148, 136], // Teal 600
		[37, 99, 235], // Blue 600
		[79, 70, 229], // Indigo 600
		[147, 51, 234], // Purple 600
		[219, 39, 119], // Pink 600
		[101, 163, 13], // Lime 600
		[8, 145, 178], // Cyan 600
		[124, 58, 237], // Violet 600
		[127, 29, 29], // Red 900
		[124, 45, 18], // Orange 900
		[6, 78, 59], // Emerald 900
		[30, 58, 138], // Blue 900
		[131, 24, 67], // Pink 900
		[19, 78, 74], // Teal 900
		[88, 28, 135], // Purple 900
		[120, 53, 15], // Amber 900
		[49, 46, 129], // Indigo 900
	];

	// Ensure positive index
	const index = Math.abs(hash) % PALETTE.length;
	return PALETTE[index] ?? [100, 100, 100];
}
