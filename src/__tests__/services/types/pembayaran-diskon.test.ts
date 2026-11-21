import { describe, expect, it } from "vitest";
import { clientUpdatePembayaranSchema } from "@/types/pembayaran.schema";
import { markAsPaidSchema } from "@/types/tagihanLain.type";

describe("markAsPaidSchema (pelunasan Tagihan Lain)", () => {
	it("menerima metode, tanggal, dan diskon valid", () => {
		const r = markAsPaidSchema.safeParse({
			id: "t1",
			metodeBayar: "QRIS",
			tanggalBayar: "2026-11-20",
			diskon: 25000,
		});
		expect(r.success).toBe(true);
	});

	it("diskon default 0 jika tidak diisi", () => {
		const r = markAsPaidSchema.parse({ id: "t1", metodeBayar: "CASH" });
		expect(r.diskon).toBe(0);
	});

	it("menolak jika metode pembayaran tidak dipilih", () => {
		expect(markAsPaidSchema.safeParse({ id: "t1" }).success).toBe(false);
	});

	it("menolak metode di luar Cash/Transfer/QRIS", () => {
		expect(
			markAsPaidSchema.safeParse({ id: "t1", metodeBayar: "KARTU" }).success,
		).toBe(false);
	});

	it("menolak diskon negatif atau pecahan", () => {
		for (const diskon of [-1, 10.5]) {
			expect(
				markAsPaidSchema.safeParse({ id: "t1", metodeBayar: "CASH", diskon })
					.success,
			).toBe(false);
		}
	});

	it("menolak format tanggal selain YYYY-MM-DD", () => {
		expect(
			markAsPaidSchema.safeParse({
				id: "t1",
				metodeBayar: "CASH",
				tanggalBayar: "20/11/2026",
			}).success,
		).toBe(false);
	});
});

describe("clientUpdatePembayaranSchema (SPP)", () => {
	const base = {
		id: "ckxxxxxxxxxxxxxxxxxxxxxxx",
		jumlahBayar: 400000,
		statusBayar: "LUNAS" as const,
	};

	it("metode dan diskon opsional di level skema", () => {
		expect(clientUpdatePembayaranSchema.safeParse(base).success).toBe(true);
	});

	it("menerima metode + diskon", () => {
		expect(
			clientUpdatePembayaranSchema.safeParse({
				...base,
				metodeBayar: "TRANSFER",
				diskon: 50000,
			}).success,
		).toBe(true);
	});

	it("menolak diskon negatif", () => {
		expect(
			clientUpdatePembayaranSchema.safeParse({ ...base, diskon: -5 }).success,
		).toBe(false);
	});
});
