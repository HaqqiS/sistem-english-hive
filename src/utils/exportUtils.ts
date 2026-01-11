import { toast } from "sonner";
import * as XLSX from "xlsx";

type ExportValue = string | number | boolean | null | undefined;
type ExportRecord = Record<string, ExportValue>;

export function downloadExcel<T extends ExportRecord>(
	data: T[],
	filename: string,
	customHeaders?: (string | number | boolean | null | undefined)[][],
) {
	if (!data || data.length === 0) {
		toast.error("Tidak ada data untuk diexport");
		return;
	}

	try {
		// Add "No" column to data
		const dataWithNumbering = data.map((item, index) => ({
			No: index + 1,
			...item,
		}));

		let worksheet: XLSX.WorkSheet;

		if (customHeaders && customHeaders.length > 0) {
			// Buat sheet dari header dulu
			worksheet = XLSX.utils.aoa_to_sheet(customHeaders);

			// Tambahkan data JSON dengan offset (beri jarak 1 baris kosong)
			// customHeaders.length baris terisi -> baris berikutnya kosong -> mulai data
			XLSX.utils.sheet_add_json(worksheet, dataWithNumbering, {
				origin: `A${customHeaders.length + 2}`,
			});
		} else {
			worksheet = XLSX.utils.json_to_sheet(dataWithNumbering);
		}

		const workbook = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(workbook, worksheet, "Data");

		XLSX.writeFile(workbook, `${filename}.xlsx`);
	} catch (error) {
		console.error("Export failed:", error);
		toast.error("Gagal melakukan export excel");
	}
}
