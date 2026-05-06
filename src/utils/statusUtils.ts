import type {
	StatusAbsenGuru,
	StatusKelas,
	StatusMurid,
	StatusOrderBuku,
	StatusPembayaran,
	StatusPendaftaran,
} from "@prisma/client";

/**
 * Mapping status to Tailwind v4 CSS variables
 * These variables are defined in globals.css
 */

export const statusMuridColorMap: Record<StatusMurid, string> = {
	AKTIF: "bg-(--badge-aktif-bg) text-(--badge-aktif-fg) border-0",
	NON_AKTIF: "bg-(--badge-non-aktif-bg) text-(--badge-non-aktif-fg) border-0",
	PENDAFTAR_BARU:
		"bg-(--badge-pendaftar-baru-bg) text-(--badge-pendaftar-baru-fg) border-0",
	LULUS: "bg-(--badge-lulus-bg) text-(--badge-lulus-fg) border-0",
	TRIAL: "bg-(--badge-trial-bg) text-(--badge-trial-fg) border-0",
	PENDING: "bg-(--badge-pending-bg) text-(--badge-pending-fg) border-0",
	PLACEMENT_TEST:
		"bg-(--badge-placement-test-bg) text-(--badge-placement-test-fg) border-0",
	ON_GOING: "bg-(--badge-on-going-bg) text-(--badge-on-going-fg) border-0",
	WAITING_LIST:
		"bg-(--badge-waiting-list-bg) text-(--badge-waiting-list-fg) border-0",
	TUNGGU_KONFIRMASI:
		"bg-(--badge-tunggu-konfirmasi-bg) text-(--badge-tunggu-konfirmasi-fg) border-0",
	OFF: "bg-(--badge-off-bg) text-(--badge-off-fg) border-0",
};

export const statusKelasColorMap: Record<StatusKelas, string> = {
	RUNNING: "bg-(--badge-running-bg) text-(--badge-running-fg) border-0",
	WAITING: "bg-(--badge-waiting-bg) text-(--badge-waiting-fg) border-0",
	TRIAL: "bg-(--badge-trial-bg) text-(--badge-trial-fg) border-0",
	LEVEL_UP: "bg-(--badge-level-up-bg) text-(--badge-level-up-fg) border-0",
	COMPLETED: "bg-(--badge-completed-bg) text-(--badge-completed-fg) border-0",
};

export const statusPendaftaranColorMap: Record<StatusPendaftaran, string> = {
	AKTIF: "bg-(--badge-aktif-bg) text-(--badge-aktif-fg) border-0",
	NON_AKTIF: "bg-(--badge-non-aktif-bg) text-(--badge-non-aktif-fg) border-0",
	TRIAL: "bg-(--badge-trial-bg) text-(--badge-trial-fg) border-0",
	WAITING_LIST:
		"bg-(--badge-waiting-list-bg) text-(--badge-waiting-list-fg) border-0",
	OFF_SEMENTARA:
		"bg-(--badge-off-sementara-bg) text-(--badge-off-sementara-fg) border-0",
};

export const statusOrderBukuColorMap: Record<StatusOrderBuku, string> = {
	BELUM_DIPROSES:
		"bg-(--badge-belum-diproses-bg) text-(--badge-belum-diproses-fg) border-0",
	DIBATALKAN:
		"bg-(--badge-dibatalkan-bg) text-(--badge-dibatalkan-fg) border-0",
	MENUNGGU_PERSETUJUAN:
		"bg-(--badge-menunggu-persetujuan-bg) text-(--badge-menunggu-persetujuan-fg) border-0",
	SUDAH_DIPESAN:
		"bg-(--badge-sudah-dipesan-bg) text-(--badge-sudah-dipesan-fg) border-0",
};

export const statusPembayaranColorMap: Record<StatusPembayaran, string> = {
	LUNAS: "bg-(--badge-paid-bg) text-(--badge-paid-fg) border-0",
	BELUM_LUNAS: "bg-(--badge-unpaid-bg) text-(--badge-unpaid-fg) border-0",
	PENDING:
		"bg-(--badge-partially-paid-bg) text-(--badge-partially-paid-fg) border-0",
};

export const statusAbsenGuruColorMap: Record<StatusAbsenGuru, string> = {
	HADIR: "bg-(--badge-hadir-bg) text-(--badge-hadir-fg) border-0",
	ALPA: "bg-(--badge-alpa-bg) text-(--badge-alpa-fg) border-0",
	SAKIT: "bg-(--badge-sakit-bg) text-(--badge-sakit-fg) border-0",
	IJIN: "bg-(--badge-ijin-bg) text-(--badge-ijin-fg) border-0",
};

/**
 * Utility to format status strings (e.g. "WAITING_LIST" -> "WAITING LIST")
 */
export const formatStatus = (status: string) => {
	return status.replace(/_/g, " ");
};
