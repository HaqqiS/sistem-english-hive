import { type Cabang, PrismaClient } from "@prisma/client";
import { parse } from "csv-parse/sync";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url"; // 👈 1. Import library URL

// 👈 2. Buat variable __dirname secara manual untuk ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

async function main() {
	// 1. Baca file CSV dari folder prisma
	const csvFilePath = path.join(__dirname, "Cabang_rows.csv");
	if (!fs.existsSync(csvFilePath)) {
		console.error("❌ File CSV tidak ditemukan di:", csvFilePath);
		process.exit(1);
	}
	const fileContent = fs.readFileSync(csvFilePath, "utf-8");

	// 2. Parse (ubah) CSV menjadi Array of Objects
	const records = parse<Cabang>(fileContent, {
		columns: true, // Menggunakan baris pertama sebagai nama key
		skip_empty_lines: true,
		trim: true,
	});

	console.log(`Menemukan ${records.length} data. Mulai import...`);

	const dataToInsert = records
		.map((row: Cabang) => {
			// Validasi sederhana
			if (!row.namaCabang) {
				console.warn(`⚠️ Baris dilewati karena namaCabang kosong:`, row);
				return null;
			}

			return {
				// -- ID --
				// Jika di schema ID adalah Int (autoincrement), JANGAN kirim ID dari CSV (hapus baris id di bawah).
				// Jika di schema ID adalah String (CUID/UUID), gunakan baris ini:
				id: row.id,

				// -- String Fields --
				namaCabang: row.namaCabang,
				alamat: row.alamat,
				noTelp: row.noTelp,

				// -- DateTime Fields (WAJIB di-convert pakai new Date) --
				createdAt: row.createdAt ? new Date(row.createdAt) : new Date(),
				updatedAt: row.updatedAt ? new Date(row.updatedAt) : new Date(),
			};
		})
		.filter((item: Cabang | null) => item !== null); // Hapus data null/invalid

	// 4. Eksekusi Insert ke Database
	if (dataToInsert.length > 0) {
		await prisma.cabang.createMany({
			data: dataToInsert,
			skipDuplicates: true, // Aman dijalankan berkali-kali
		});
		console.log(
			`✅ Berhasil import ${dataToInsert.length} data Cabang ke Railway!`,
		);
	} else {
		console.log("⚠️ Tidak ada data valid untuk diimport.");
	}
}

main()
	.then(async () => {
		await prisma.$disconnect();
	})
	.catch(async (e) => {
		console.error("❌ Terjadi Error saat Seeding:");
		console.error(e);
		await prisma.$disconnect();
		process.exit(1);
	});
