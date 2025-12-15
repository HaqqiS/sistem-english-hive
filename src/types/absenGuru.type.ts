import { StatusAbsenGuru } from "@prisma/client";
import z from "zod";
import type { RouterOutputs } from "@/trpc/react";

/** Tipe tunggal absensi guru (biasanya untuk list/table) */
export type TypeAbsensiGuru =
	RouterOutputs["absenGuru"]["getAllAbsensi"]["data"][number];
export type TypeAbsensiGuruPaginated =
	RouterOutputs["absenGuru"]["getAllAbsensi"];

/** Tipe history gaji/absensi guru */
export type TypeAbsensiGuruHistory =
	RouterOutputs["absenGuru"]["getHistoryByGuruId"];

/** Tipe item tunggal dalam history */
export type TypeAbsensiGuruHistoryItem = TypeAbsensiGuruHistory[number];

// ==========================================
// 2. WRITE SCHEMAS (Input untuk Mutasi)
// ==========================================

/**
 * SCHEMA: CREATE (Mulai Sesi)
 * Digunakan saat guru menekan tombol "Mulai Sesi" dari jadwal.
 */
export const serverStartSesiSchema = z.object({
	/** ID dari JadwalKelas (rencana) */
	jadwalKelasId: z.string().cuid("ID Jadwal tidak valid"),
	/** Status kehadiran saat memulai (default: HADIR) */
	status: z.nativeEnum(StatusAbsenGuru, {
		errorMap: () => ({ message: "Status absen guru tidak valid" }),
	}),
	/** ID Ruang override (opsional, jika pindah ruang) */
	overrideRuangId: z.string().cuid("ID Ruang tidak valid").optional(),
});

/**
 * SCHEMA: UPDATE (Edit Absensi Lengkap)
 * Mengizinkan admin mengubah status, verifikasi, bahkan mengganti guru.
 */
export const updateAbsensiGuruSchema = z.object({
	status: z.nativeEnum(StatusAbsenGuru, {
		required_error: "Status harus dipilih",
	}),

	isVerified: z.coerce.boolean({
		required_error: "Status verifikasi harus ditentukan",
	}),

	/**
	 * Opsional: Jika ingin memindahkan absensi ini ke guru lain.
	 * (Misal: Admin salah input nama guru)
	 */
	guruId: z.string().cuid("ID Guru tidak valid").optional(),
});

export type TypeUpdateAbsensiGuruSchema = z.infer<
	typeof updateAbsensiGuruSchema
>;

/**
 * SCHEMA: VERIFY (Verifikasi Admin)
 * Digunakan di halaman verifikasi.
 */
export const verifyAbsensiSchema = z.object({
	absensiId: z.string().cuid(),
	isVerified: z.boolean(),
});
