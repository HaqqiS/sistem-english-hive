import { PrismaClient, type Murid } from "@prisma/client";
import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

async function main() {
  // 1. Baca file CSV dari folder prisma
  const csvFilePath = path.join(__dirname, "Murid_rows.csv");
  if (!fs.existsSync(csvFilePath)) {
    console.error("❌ File CSV tidak ditemukan di:", csvFilePath);
    process.exit(1);
  }
  const fileContent = fs.readFileSync(csvFilePath, "utf-8");

  // 2. Parse (ubah) CSV menjadi Array of Objects
  const records = parse<Murid>(fileContent, {
    columns: true, // Menggunakan baris pertama sebagai nama key
    skip_empty_lines: true,
    trim: true,
  });

  console.log(`Menemukan ${records.length} data. Mulai import...`);

  const dataToInsert = records
    .map((row: Murid) => {
      // Validasi sederhana
      if (!row.namaLengkap) {
        console.warn(`⚠️ Baris dilewati karena namaLengkap kosong:`, row);
        return null;
      }

      return {
        // -- ID --
        id: row.id,
        // -- String Fields --
        namaLengkap: row.namaLengkap,
        email: row.email,
        alamat: row.alamat,
        gender: row.gender,
        asalSekolah: row.asalSekolah,
        kelasSekolah: row.kelasSekolah,
        jamPulang: row.jamPulang,
        noWA: row.noWA,
        pilihanProgram: row.pilihanProgram,
        sumberInfo: row.sumberInfo,
        deskripsi: row.deskripsi,
        statusMurid: row.statusMurid,
        cabangId: row.cabangId,

        umur: parseInt(row.umur as unknown as string),

        // -- DateTime Fields (WAJIB di-convert pakai new Date) --
        createdAt: row.createdAt ? new Date(row.createdAt) : new Date(),
        updatedAt: row.updatedAt ? new Date(row.updatedAt) : new Date(),
      };
    })
    .filter((item: Murid | null) => item !== null); // Hapus data null/invalid

  // 4. Eksekusi Insert ke Database
  if (dataToInsert.length > 0) {
    await prisma.murid.createMany({
      data: dataToInsert,
      skipDuplicates: true, // Aman dijalankan berkali-kali
    });
    console.log(
      `✅ Berhasil import ${dataToInsert.length} data Murid ke Railway!`,
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
