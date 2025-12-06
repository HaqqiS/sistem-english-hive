import type { Session } from "next-auth";
import { TRPCError } from "@trpc/server";
import { UserRole } from "../auth/type";

/**
 * Mengembalikan cabangId yang WAJIB dipakai untuk query.
 * @param session Session user yang sedang login
 * @param requestedCabangId (Opsional) Cabang yang ingin dilihat oleh Manager
 */
export const getRestrictedCabangId = (
  session: Session | null,
  requestedCabangId?: string | null,
) => {
  if (!session?.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  const { role, cabangId } = session.user;

  // KASUS 1: ADMIN / GURU
  // Mereka HANYA boleh melihat data cabang mereka sendiri.
  // Input 'requestedCabangId' dari frontend diabaikan/ditimpa.
  if (role === UserRole.ADMIN || role === UserRole.GURU) {
    if (!cabangId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Akun Anda tidak terhubung dengan cabang manapun.",
      });
    }
    return cabangId;
  }

  // KASUS 2: MANAGER
  // Jika Manager memilih spesifik cabang di UI (requestedCabangId), pakai itu.
  // Jika tidak (atau memilih "ALL"), kembalikan undefined agar Prisma mengambil semua data.
  if (role === UserRole.MANAGER) {
    return requestedCabangId && requestedCabangId !== "ALL"
      ? requestedCabangId
      : undefined;
  }

  // Default deny
  throw new TRPCError({ code: "FORBIDDEN" });
};
