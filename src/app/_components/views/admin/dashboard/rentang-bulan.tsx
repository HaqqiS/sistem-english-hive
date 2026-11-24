"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

export const PILIHAN_BULAN = [6, 12] as const;
export type JumlahBulan = (typeof PILIHAN_BULAN)[number];

/**
 * Rentang bulan untuk grafik dashboard: otomatis 6 bulan di HP dan 12 bulan di
 * layar lebar, kecuali pengguna memilih sendiri lewat <RentangBulanToggle />.
 */
export function useRentangBulan() {
	const isMobile = useIsMobile();
	// null = ikuti ukuran layar; angka = pilihan manual pengguna
	const [pilihan, setPilihan] = useState<JumlahBulan | null>(null);
	const jumlahBulan: JumlahBulan = pilihan ?? (isMobile ? 6 : 12);
	return { jumlahBulan, setPilihan };
}

/** Tombol pilihan "6 Bln | 12 Bln". */
export function RentangBulanToggle({
	jumlahBulan,
	onChange,
}: {
	jumlahBulan: JumlahBulan;
	onChange: (n: JumlahBulan) => void;
}) {
	return (
		<fieldset
			className="bg-muted m-0 inline-flex w-fit min-w-0 rounded-lg border-0 p-1"
			aria-label="Rentang bulan"
		>
			{PILIHAN_BULAN.map((n) => (
				<Button
					key={n}
					type="button"
					size="sm"
					variant="ghost"
					aria-pressed={jumlahBulan === n}
					onClick={() => onChange(n)}
					className={cn(
						"h-7 px-3 text-xs",
						jumlahBulan === n &&
							"bg-background text-foreground shadow-sm hover:bg-background",
					)}
				>
					{n} Bln
				</Button>
			))}
		</fieldset>
	);
}