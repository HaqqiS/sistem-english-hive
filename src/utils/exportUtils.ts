import { toast } from "sonner";
import * as XLSX from "xlsx";

type ExportValue = string | number | boolean | null | undefined;
type ExportRecord = Record<string, ExportValue>;

export function downloadExcel<T extends ExportRecord>(
	data: T[],
	filename: string,
) {
	if (!data || data.length === 0) {
		toast.error("Tidak ada data untuk diexport");
		return;
	}

	try {
		const worksheet = XLSX.utils.json_to_sheet(data);
		const workbook = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(workbook, worksheet, "Data");

		XLSX.writeFile(workbook, `${filename}.xlsx`);
	} catch (error) {
		console.error("Export failed:", error);
		toast.error("Gagal melakukan export excel");
	}
}
