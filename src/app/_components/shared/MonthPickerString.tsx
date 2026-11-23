"use client";

import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import dayjs, { TIMEZONE_BISNIS } from "@/utils/dateUtils";

const NAMA_BULAN = [
	"Januari",
	"Februari",
	"Maret",
	"April",
	"Mei",
	"Juni",
	"Juli",
	"Agustus",
	"September",
	"Oktober",
	"November",
	"Desember",
];
const SINGKAT = [
	"Jan",
	"Feb",
	"Mar",
	"Apr",
	"Mei",
	"Jun",
	"Jul",
	"Agu",
	"Sep",
	"Okt",
	"Nov",
	"Des",
];

const parseBulan = (v: string) => {
	const m = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(v);
	return m ? { tahun: Number(m[1]), bulan: Number(m[2]) } : null;
};

interface MonthPickerStringProps {
	/** Bulan "YYYY-MM". */
	value: string;
	onChange: (value: string) => void;
	/** Nonaktifkan bulan setelah bulan ini (WITA). Default: true. */
	disableFuture?: boolean;
	className?: string;
}

/** Pemilih bulan berbasis grid (tanpa mengetik). Nilai "YYYY-MM". */
export function MonthPickerString({
	value,
	onChange,
	disableFuture = true,
	className,
}: MonthPickerStringProps) {
	const [open, setOpen] = useState(false);
	const dipilih = parseBulan(value);
	const sekarang = dayjs().tz(TIMEZONE_BISNIS);
	const tahunIni = sekarang.year();
	const bulanIni = sekarang.month() + 1;

	const [tahunTampil, setTahunTampil] = useState(dipilih?.tahun ?? tahunIni);

	const terkunci = (tahun: number, bulan: number) =>
		disableFuture &&
		(tahun > tahunIni || (tahun === tahunIni && bulan > bulanIni));

	return (
		<Popover
			open={open}
			onOpenChange={(o) => {
				setOpen(o);
				if (o) setTahunTampil(dipilih?.tahun ?? tahunIni);
			}}
		>
			<PopoverTrigger asChild>
				<Button
					type="button"
					variant="outline"
					aria-label="Pilih bulan"
					className={cn(
						"h-10 w-full justify-between pl-3 font-normal",
						className,
					)}
				>
					<span>
						{dipilih
							? `${NAMA_BULAN[dipilih.bulan - 1]} ${dipilih.tahun}`
							: "Pilih bulan"}
					</span>
					<CalendarIcon className="ml-2 h-4 w-4 shrink-0 opacity-60" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-64 p-3" align="end">
				<div className="mb-3 flex items-center justify-between">
					<Button
						type="button"
						variant="ghost"
						size="icon"
						className="h-8 w-8"
						aria-label="Tahun sebelumnya"
						onClick={() => setTahunTampil((t) => t - 1)}
					>
						<ChevronLeft className="h-4 w-4" />
					</Button>
					<span className="text-sm font-semibold">{tahunTampil}</span>
					<Button
						type="button"
						variant="ghost"
						size="icon"
						className="h-8 w-8"
						aria-label="Tahun berikutnya"
						disabled={disableFuture && tahunTampil >= tahunIni}
						onClick={() => setTahunTampil((t) => t + 1)}
					>
						<ChevronRight className="h-4 w-4" />
					</Button>
				</div>
				<div className="grid grid-cols-3 gap-2">
					{SINGKAT.map((nama, i) => {
						const bulan = i + 1;
						const aktif =
							dipilih?.tahun === tahunTampil && dipilih.bulan === bulan;
						return (
							<Button
								key={nama}
								type="button"
								size="sm"
								variant={aktif ? "default" : "ghost"}
								disabled={terkunci(tahunTampil, bulan)}
								onClick={() => {
									onChange(`${tahunTampil}-${String(bulan).padStart(2, "0")}`);
									setOpen(false);
								}}
							>
								{nama}
							</Button>
						);
					})}
				</div>
				<Button
					type="button"
					variant="secondary"
					size="sm"
					className="mt-3 w-full"
					onClick={() => {
						onChange(sekarang.format("YYYY-MM"));
						setOpen(false);
					}}
				>
					Bulan ini
				</Button>
			</PopoverContent>
		</Popover>
	);
}