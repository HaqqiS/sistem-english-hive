import { StatusAbsenGuru } from "@prisma/client";
import { describe, expect, it } from "vitest";
import {
	calculateTotalGaji,
	GAJI_PER_SESI,
	getPeriodeGaji,
} from "../server/services/gaji.service";

describe("Gaji Service", () => {
	describe("getPeriodeGaji", () => {
		it("should return correct period for specific month", () => {
			const monthStr = "2024-02"; // February 2024
			const { startDate, endDate } = getPeriodeGaji(monthStr);

			// Expected: 26 Jan 2024 to 25 Feb 2024
			expect(startDate.getDate()).toBe(26);
			expect(startDate.getMonth()).toBe(0); // Jan is 0
			expect(startDate.getFullYear()).toBe(2024);

			expect(endDate.getDate()).toBe(25);
			expect(endDate.getMonth()).toBe(1); // Feb is 1
			expect(endDate.getFullYear()).toBe(2024);
		});

		it("should handle year turnover correctly", () => {
			const monthStr = "2024-01"; // Jan 2024
			const { startDate, endDate } = getPeriodeGaji(monthStr);

			// Expected: 26 Dec 2023 to 25 Jan 2024
			expect(startDate.getDate()).toBe(26);
			expect(startDate.getMonth()).toBe(11); // Dec is 11
			expect(startDate.getFullYear()).toBe(2023);

			expect(endDate.getDate()).toBe(25);
			expect(endDate.getMonth()).toBe(0); // Jan is 0
			expect(endDate.getFullYear()).toBe(2024);
		});
	});

	describe("calculateTotalGaji", () => {
		it("should calculate correct salary based on attendance", () => {
			const mockHistory = [
				{ status: StatusAbsenGuru.HADIR },
				{ status: StatusAbsenGuru.HADIR },
				{ status: StatusAbsenGuru.IJIN }, // Should not be counted
				{ status: StatusAbsenGuru.ALPA }, // Should not be counted
				{ status: StatusAbsenGuru.HADIR },
			];

			const result = calculateTotalGaji(mockHistory);

			expect(result.totalHadir).toBe(3);
			expect(result.totalGaji).toBe(3 * GAJI_PER_SESI);
		});

		it("should return 0 if no attendance", () => {
			const mockHistory: { status: StatusAbsenGuru }[] = [];
			const result = calculateTotalGaji(mockHistory);

			expect(result.totalHadir).toBe(0);
			expect(result.totalGaji).toBe(0);
		});
	});
});
