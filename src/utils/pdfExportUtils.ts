import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "sonner";

interface ClassInfo {
	kodeKelas?: string;
	level: number;
	grup: string | null;
	bulanTahun: string;
	pengajar?: string;
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

	const doc = new jsPDF();

	// === CONFIG ===
	let currentY = 15;

	// === HEADER: INFORMASI KELAS (Custom Table-like layout) ===
	doc.setFontSize(10);
	doc.setFont("helvetica", "bold");

	// Draw Header Box
	// autoTable can be used for the header info too to match the "grid" look
	autoTable(doc, {
		startY: currentY,
		head: [
			[
				{
					content: "INFORMASI KELAS",
					colSpan: 2,
					styles: { halign: "left", fillColor: [40, 40, 40], textColor: 255 },
				},
			],
		],
		body: [
			["Kode Kelas", classInfo.kodeKelas || "-"],
			["Nama Pengajar", classInfo.pengajar || "-"], // Sesuai gambar
			// ["Level", classInfo.level.toString()], // Opsional, di gambar hanya ada Kode Kelas & Pengajar di header atas
			// ["Bulan/Tahun", classInfo.bulanTahun]
		],
		theme: "grid",
		styles: {
			fontSize: 10,
			cellPadding: 3,
			lineColor: [0, 0, 0],
			lineWidth: 0.1,
		},
		columnStyles: {
			0: { fontStyle: "bold", cellWidth: 40 },
		},
		margin: { left: 14, right: 14 },
	});

	// biome-ignore lint/suspicious/noExplicitAny: jspdf-autotable adds lastAutoTable to jsPDF instance
	currentY = (doc as any).lastAutoTable.finalY + 5;

	// === TABLE: DAFTAR MURID ===
	// Sesuai gambar: Header title "daftar murid" in a box
	autoTable(doc, {
		startY: currentY,
		head: [
			[
				{
					content: "DAFTAR MURID",
					styles: { halign: "left", fillColor: [40, 40, 40], textColor: 255 },
				},
			],
		],
		body: [],
		theme: "grid",
		styles: {
			fontSize: 10,
			cellPadding: 3,
			lineColor: [0, 0, 0],
			lineWidth: 0.1,
		},
		margin: { left: 14, right: 14 },
	});

	// biome-ignore lint/suspicious/noExplicitAny: jspdf-autotable adds lastAutoTable to jsPDF instance
	currentY = (doc as any).lastAutoTable.finalY; // Attach immediately below

	// Columns: No, Nama, Kehadiran (Wide empty space)
	const tableBody = students.map((s, index) => [
		index + 1,
		s.namaMurid,
		"", // Empty for Kehadiran checklist
	]);

	autoTable(doc, {
		startY: currentY,
		head: [["NO", "Nama", "Kehadiran"]],
		body: tableBody,
		theme: "grid",
		headStyles: {
			fillColor: [40, 40, 40],
			textColor: 255,
			fontStyle: "bold",
			halign: "center",
		},
		styles: {
			fontSize: 10,
			cellPadding: 4, // More padding for writing space
			lineColor: [0, 0, 0],
			lineWidth: 0.1,
			valign: "middle",
		},
		columnStyles: {
			0: { halign: "center", cellWidth: 15 }, // No
			1: { cellWidth: 60 }, // Nama
			2: {}, // Kehadiran (rest of width)
		},
		margin: { left: 14, right: 14 },
	});

	// Save
	doc.save(
		`Absensi-${classInfo.kodeKelas}-${classInfo.bulanTahun.replace("/", "-")}.pdf`,
	);
};

export const exportJadwalMatrixPDF = (
	hari: string,
	rooms: { id: string; namaRuang: string }[],
	timeSlots: string[],
	// biome-ignore lint/suspicious/noExplicitAny: complex object
	scheduleMap: Record<string, Record<string, any>>,
) => {
	if (!timeSlots.length || !rooms.length) {
		toast.error("Tidak ada data jadwal untuk diexport");
		return;
	}

	const doc = new jsPDF({ orientation: "landscape" });

	const currentY = 15;

	// TITLE
	doc.setFontSize(14);
	doc.setFont("helvetica", "bold");
	doc.text(`JADWAL KELAS - HARI ${hari}`, 14, 10);
	doc.setFontSize(8);
	doc.text(`Dicetak pada: ${new Date().toLocaleString()}`, 14, currentY);

	// HEADERS
	const head = [["WAKTU", ...rooms.map((r) => r.namaRuang)]];

	// BODY
	const body = timeSlots.map((time) => {
		const row = [time]; // First col is Time
		rooms.forEach((room) => {
			const schedule = scheduleMap[time]?.[room.id];
			if (schedule) {
				const teacherName = schedule.guru || "No Guru";
				const content =
					`${schedule.kodeKelas}\n` +
					`${teacherName}\n` +
					`${schedule.jamMulai} - ${schedule.jamSelesai}\n` +
					`${schedule.tipeKelas} (${schedule.statusKelas})\n` +
					`${schedule.jumlahMurid ? `${schedule.jumlahMurid} Murid` : ""}`;
				row.push(content);
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
			fontSize: 7, // Smaller font for matrix
			cellPadding: 2,
			lineColor: [200, 200, 200],
			lineWidth: 0.1,
			valign: "top",
		},
		headStyles: {
			fillColor: [40, 40, 40],
			textColor: 255,
			fontStyle: "bold",
			halign: "center",
			valign: "middle",
		},
		columnStyles: {
			0: {
				fontStyle: "bold",
				cellWidth: 20,
				halign: "center",
				valign: "middle",
			}, // Waktu column
			// Other columns auto-width
		},
		margin: { left: 10, right: 10, bottom: 10 },
	});

	const dateStr = new Date().toISOString().split("T")[0];
	doc.save(`Jadwal-${hari}-${dateStr}.pdf`);
};
