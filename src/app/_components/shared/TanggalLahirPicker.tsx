"use client";

import { CalendarIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import dayjs, { TIMEZONE_BISNIS } from "@/utils/dateUtils";

type Lang = "id" | "en";

const BULAN: Record<Lang, string[]> = {
	id: [
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
	],
	en: [
		"January",
		"February",
		"March",
		"April",
		"May",
		"June",
		"July",
		"August",
		"September",
		"October",
		"November",
		"December",
	],
};

const TEKS = {
	id: {
		hari: "Tanggal",
		bulan: "Bulan",
		tahun: "Tahun",
		pilih: "Pilih",
		lengkapi: "Pilih tanggal, bulan, dan tahun",
		usia: (n: number) => `Usia ${n} tahun`,
		placeholder: "Pilih tanggal lahir",
	},
	en: {
		hari: "Day",
		bulan: "Month",
		tahun: "Year",
		pilih: "Select",
		lengkapi: "Select day, month, and year",
		usia: (n: number) => `Age ${n} years`,
		placeholder: "Select date of birth",
	},
} as const;

type Draft = { d?: number; m?: number; y?: number };

const parse = (v: string): Draft => {
	const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(v);
	return m ? { y: Number(m[1]), m: Number(m[2]), d: Number(m[3]) } : {};
};

const jumlahHari = (y: number | undefined, m: number | undefined) =>
	m ? new Date(y ?? 2000, m, 0).getDate() : 31;

const pad = (n: number) => String(n).padStart(2, "0");

type Item = { value: number; label: string; disabled?: boolean };

/** Satu kolom pilihan yang bisa di-scroll dengan target sentuh besar. */
function Kolom({
	label,
	items,
	selected,
	onSelect,
	scrollTo,
	className,
}: {
	label: string;
	items: Item[];
	selected?: number;
	onSelect: (v: number) => void;
	/** Item yang diposisikan di tengah saat dibuka jika belum ada pilihan. */
	scrollTo?: number;
	className?: string;
}) {
	const listRef = useRef<HTMLDivElement>(null);

	// Gulir ke item terpilih (atau default) saat kolom pertama kali tampil
	// biome-ignore lint/correctness/useExhaustiveDependencies: hanya saat mount
	useEffect(() => {
		const list = listRef.current;
		if (!list) return;
		const target = selected ?? scrollTo;
		const el = list.querySelector<HTMLElement>(`[data-value="${target}"]`);
		if (el) {
			list.scrollTop =
				el.offsetTop - list.clientHeight / 2 + el.clientHeight / 2;
		}
	}, []);

	return (
		<div className={cn("flex min-w-0 flex-col", className)}>
			<p className="text-muted-foreground mb-1 text-center text-xs font-medium">
				{label}
			</p>
			<div
				ref={listRef}
				role="listbox"
				aria-label={label}
				className="bg-muted/40 h-56 space-y-0.5 overflow-y-auto overscroll-contain rounded-lg p-1"
			>
				{items.map((it) => {
					const aktif = it.value === selected;
					return (
						<button
							key={it.value}
							type="button"
							role="option"
							aria-selected={aktif}
							data-value={it.value}
							disabled={it.disabled}
							onClick={() => onSelect(it.value)}
							className={cn(
								"h-11 w-full truncate rounded-md px-1 text-sm transition-colors",
								aktif
									? "bg-primary text-primary-foreground font-semibold"
									: "hover:bg-muted active:bg-muted",
								it.disabled && "pointer-events-none opacity-30",
							)}
						>
							{it.label}
						</button>
					);
				})}
			</div>
		</div>
	);
}

interface TanggalLahirPickerProps {
	id?: string;
	/** "YYYY-MM-DD", atau kosong jika belum dipilih. */
	value: string;
	onChange: (value: string) => void;
	lang?: Lang;
	placeholder?: string;
	disabled?: boolean;
	/** Tahun paling awal di daftar. Default 1940. */
	startYear?: number;
	/** Tahun yang diposisikan di tengah saat belum ada pilihan. Default: 10 tahun lalu. */
	defaultYearOffset?: number;
	className?: string;
}

/**
 * Pemilih tanggal lahir ramah HP: tiga kolom besar (Tanggal, Bulan, Tahun)
 * yang tinggal disentuh, tanpa mengetik dan tanpa menggulir kalender
 * bulan demi bulan. Hasil dikirim sebagai "YYYY-MM-DD" setelah menekan "Pilih".
 */
export function TanggalLahirPicker({
	id,
	value,
	onChange,
	lang = "id",
	placeholder,
	disabled,
	startYear = 1940,
	defaultYearOffset = 10,
	className,
}: TanggalLahirPickerProps) {
	const t = TEKS[lang];
	const namaBulan = BULAN[lang];
	const [open, setOpen] = useState(false);
	const [draft, setDraft] = useState<Draft>({});

	const sekarang = dayjs().tz(TIMEZONE_BISNIS);
	const tahunIni = sekarang.year();
	const bulanIni = sekarang.month() + 1;
	const hariIni = sekarang.date();

	const dipilih = parse(value);
	const lengkap = dipilih.d && dipilih.m && dipilih.y;

	const { d, m, y } = draft;
	const maksHari = jumlahHari(y, m);

	const tahunItems: Item[] = [];
	for (let yr = tahunIni; yr >= startYear; yr--) {
		tahunItems.push({ value: yr, label: String(yr) });
	}
	const bulanItems: Item[] = namaBulan.map((label, i) => ({
		value: i + 1,
		label,
		disabled: y === tahunIni && i + 1 > bulanIni,
	}));
	const hariItems: Item[] = Array.from({ length: maksHari }, (_, i) => ({
		value: i + 1,
		label: String(i + 1),
		disabled: y === tahunIni && m === bulanIni && i + 1 > hariIni,
	}));

	const set = (patch: Draft) =>
		setDraft((prev) => {
			const next = { ...prev, ...patch };
			// Rapikan kombinasi yang tidak valid (mis. 31 Februari / masa depan)
			if (next.m && next.y === tahunIni && next.m > bulanIni)
				next.m = undefined;
			if (next.d && next.d > jumlahHari(next.y, next.m)) next.d = undefined;
			if (
				next.d &&
				next.y === tahunIni &&
				next.m === bulanIni &&
				next.d > hariIni
			) {
				next.d = undefined;
			}
			return next;
		});

	const siap = !!(d && m && y);
	const usia = siap
		? Math.max(0, sekarang.diff(dayjs(`${y}-${pad(m)}-${pad(d)}`), "year"))
		: null;

	const konfirmasi = () => {
		if (!(d && m && y)) return;
		onChange(`${y}-${pad(m)}-${pad(d)}`);
		setOpen(false);
	};

	return (
		<Popover
			open={open}
			onOpenChange={(o) => {
				setOpen(o);
				if (o) setDraft(parse(value));
			}}
		>
			<PopoverTrigger asChild>
				<Button
					id={id}
					type="button"
					variant="outline"
					disabled={disabled}
					className={cn(
						"h-10 w-full justify-between pl-3 text-left font-normal",
						!lengkap && "text-muted-foreground",
						className,
					)}
				>
					<span className="truncate">
						{lengkap
							? `${dipilih.d} ${namaBulan[(dipilih.m ?? 1) - 1]} ${dipilih.y}`
							: (placeholder ?? t.placeholder)}
					</span>
					<CalendarIcon className="ml-2 h-4 w-4 shrink-0 opacity-60" />
				</Button>
			</PopoverTrigger>
			<PopoverContent
				align="start"
				collisionPadding={8}
				className="w-[min(22rem,calc(100vw-1.5rem))] p-3"
				// Form ini sering tampil di dalam Dialog/Drawer modal. Dialog tersebut
				// memblokir scroll (mouse wheel & sentuh) di luar elemennya sendiri, dan
				// popover ini di-render di luar dialog. Hentikan event agar tidak sampai
				// ke penghalang scroll tersebut, sehingga daftar tetap bisa di-scroll.
				onWheel={(e) => e.stopPropagation()}
				onTouchMove={(e) => e.stopPropagation()}
			>
				<div className="flex gap-2">
					<Kolom
						label={t.hari}
						items={hariItems}
						selected={d}
						onSelect={(v) => set({ d: v })}
						className="w-16 shrink-0"
					/>
					<Kolom
						label={t.bulan}
						items={bulanItems}
						selected={m}
						onSelect={(v) => set({ m: v })}
						className="flex-1"
					/>
					<Kolom
						label={t.tahun}
						items={tahunItems}
						selected={y}
						scrollTo={tahunIni - defaultYearOffset}
						onSelect={(v) => set({ y: v })}
						className="w-20 shrink-0"
					/>
				</div>

				<p className="text-muted-foreground mt-3 min-h-5 text-center text-sm">
					{siap && m
						? `${d} ${namaBulan[m - 1]} ${y} · ${t.usia(usia ?? 0)}`
						: t.lengkapi}
				</p>

				<Button
					type="button"
					className="mt-2 h-11 w-full"
					disabled={!siap}
					onClick={konfirmasi}
				>
					{t.pilih}
				</Button>
			</PopoverContent>
		</Popover>
	);
}