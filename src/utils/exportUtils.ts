import { toast } from "sonner";

type CsvValue = string | number | boolean | null | undefined;
type CsvRecord = Record<string, CsvValue>;

export function downloadCSV<T extends CsvRecord>(data: T[], filename: string) {
  if (!data || data.length === 0) {
    toast.error("Tidak ada data untuk diexport");
    return;
  }

  // 1. Ambil Header dari key objek pertama
  const firstItem = data[0];
  if (!firstItem) return;
  const headers = Object.keys(firstItem);

  // 2. Buat string CSV
  const csvContent = [
    headers.join(","), // Header Row
    ...data.map((row) =>
      headers
        .map((fieldName) => {
          // Handle koma dalam data (misal alamat ada komanya)
          const key = fieldName as keyof T;
          const val = row[key];

          // Konversi ke string aman
          const stringVal =
            val === null || val === undefined ? "" : String(val);

          // Escape double quotes: " -> "" (Standar CSV untuk data yang mengandung kutip)
          // Bungkus dengan kutip dua untuk menangani koma dalam data
          return `"${stringVal.replace(/"/g, '""')}"`;
        })
        .join(","),
    ),
  ].join("\n");

  // 3. Trigger Download
  const blob = new Blob(["\uFEFF" + csvContent], {
    type: "text/csv;charset=utf-8;",
  });

  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();

  // Cleanup
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
