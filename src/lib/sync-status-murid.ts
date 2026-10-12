import type {
	Prisma,
	PrismaClient,
	StatusMurid,
	StatusPendaftaran,
} from "@prisma/client";

type Db = PrismaClient | Prisma.TransactionClient;

/**
 * Urutan prioritas jika murid punya lebih dari satu pendaftaran kelas.
 * Yang paling atas menang. Ubah urutan ini kalau aturan bisnisnya berbeda.
 */
const PRIORITAS: StatusPendaftaran[] = [
	"AKTIF",
	"TRIAL",
	"OFF_SEMENTARA",
	"WAITING_LIST",
	"NON_AKTIF",
];

/**
 * Status murid yang "dimiliki" oleh status di kelas.
 * Status lain (LULUS, PENDAFTAR_BARU, PLACEMENT_TEST, dst.) adalah status manual
 * dan tidak ditimpa saat murid tidak lagi punya kelas.
 */
const STATUS_TERIKAT_KELAS: StatusMurid[] = [
	"AKTIF",
	"TRIAL",
	"OFF_SEMENTARA",
	"WAITING_LIST",
];

export type SyncOptions = {
	/**
	 * Status yang dipakai kalau murid sudah tidak punya pendaftaran kelas sama
	 * sekali (misalnya setelah kelas dihapus). Hanya diterapkan jika status murid
	 * saat ini masih terikat kelas. Default: tidak mengubah apa-apa.
	 */
	statusJikaTanpaKelas?: StatusMurid;
};

/**
 * Hitung status murid yang seharusnya, berdasarkan status pendaftaran kelasnya.
 * Mengembalikan undefined kalau tidak perlu ada perubahan.
 */
export function hitungStatusMurid(
	statusSaatIni: StatusMurid,
	statusPendaftarans: StatusPendaftaran[],
	opsi?: SyncOptions,
): StatusMurid | undefined {
	let target: StatusMurid | undefined;

	if (statusPendaftarans.length === 0) {
		// Tidak punya kelas sama sekali
		target = opsi?.statusJikaTanpaKelas;
		if (!STATUS_TERIKAT_KELAS.includes(statusSaatIni)) return undefined;
	} else {
		const ada = new Set(statusPendaftarans);
		target = PRIORITAS.find((s) => ada.has(s));
		// Semua kelas NON_AKTIF: jangan timpa status manual (mis. LULUS)
		if (
			target === "NON_AKTIF" &&
			!STATUS_TERIKAT_KELAS.includes(statusSaatIni)
		) {
			return undefined;
		}
	}

	if (!target || target === statusSaatIni) return undefined;
	return target;
}

/**
 * Sinkronkan Murid.statusMurid dari PendaftaranKelas.status.
 * Status di kelas = sumber kebenaran.
 */
export async function syncStatusMurid(
	db: Db,
	muridId: string,
	opsi?: SyncOptions,
) {
	const murid = await db.murid.findUnique({
		where: { id: muridId },
		select: {
			statusMurid: true,
			pendaftaranKelases: { select: { status: true } },
		},
	});
	if (!murid) return;

	const target = hitungStatusMurid(
		murid.statusMurid,
		murid.pendaftaranKelases.map((p) => p.status),
		opsi,
	);
	if (!target) return;

	await db.murid.update({
		where: { id: muridId },
		data: { statusMurid: target },
	});
}

/** Untuk banyak murid sekaligus. */
export async function syncStatusMuridBanyak(
	db: Db,
	muridIds: string[],
	opsi?: SyncOptions,
) {
	for (const id of new Set(muridIds)) {
		await syncStatusMurid(db, id, opsi);
	}
}
