import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
// Impor skema Zod yang baru kita buat
import { serverCreateJadwalSchema } from "@/types/jadwalKelas.type";
import { TRPCError } from "@trpc/server";

export const jadwalKelasRouter = createTRPCRouter({
  /**
   * Membuat JadwalKelas baru.
   * Ini menangani kelas REGULAR (link ke JamSlotTetap)
   * dan kelas PRIVATE (membuat JamSlotCustom baru)
   */
  create: protectedProcedure
    .input(serverCreateJadwalSchema)
    .mutation(async ({ ctx, input }) => {
      const { db } = ctx;
      const { kelasId, ruangId, hari, tipeJam } = input;

      // Kita gunakan transaction untuk memastikan
      // JamSlotCustom (jika ada) dan JadwalKelas dibuat bersamaan.
      const newJadwal = await db.$transaction(async (tx) => {
        let jamSlotCustomId: string | undefined = undefined;
        let jamSlotTetapId: string | undefined = undefined;

        // Cek tipe jadwal yang dikirim dari UI
        if (tipeJam === "CUSTOM") {
          // --- Alur Kelas Privat ---
          // 1. Buat dulu entri JamSlotCustom
          const newJamCustom = await tx.jamSlotCustom.create({
            data: {
              jamMulai: input.jamMulai, // 'input.jamMulai' dijamin ada & valid oleh Zod
              jamSelesai: input.jamSelesai, // 'input.jamSelesai' dijamin ada & valid oleh Zod
            },
          });
          jamSlotCustomId = newJamCustom.id;
        } else if (tipeJam === "TETAP") {
          // --- Alur Kelas Reguler ---
          // 1. Cukup catat ID-nya.
          jamSlotTetapId = input.jamSlotTetapId; // 'input.jamSlotTetapId' dijamin ada

          // (Validasi Ekstra Opsional tapi Direkomendasikan)
          // Cek apakah slot jam & ruang ada di cabang yang sama
          const slot = await tx.jamSlotTetap.findUnique({
            where: { id: jamSlotTetapId },
            select: { cabangId: true },
          });
          const ruang = await tx.ruang.findUnique({
            where: { id: ruangId },
            select: { cabangId: true },
          });

          if (slot?.cabangId !== ruang?.cabangId) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Cabang dari Slot Jam dan Ruangan tidak cocok.",
            });
          }
        }

        // 2. Buat JadwalKelas yang menunjuk ke slot yang benar
        const createdJadwal = await tx.jadwalKelas.create({
          data: {
            kelasId: kelasId,
            ruangId: ruangId,
            hari: hari,
            jamSlotTetapId: jamSlotTetapId, // Akan null jika privat
            jamSlotCustomId: jamSlotCustomId, // Akan null jika reguler
          },
        });

        return createdJadwal;
      });

      return newJadwal;
    }),

  // Anda bisa menambahkan router getAll, update, delete di sini nanti
});
