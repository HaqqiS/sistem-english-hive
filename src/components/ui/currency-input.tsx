"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";

/** Batas aman kolom Int PostgreSQL (32-bit). */
const MAX_INT = 2_147_483_647;

const formatRibuan = (n: number) => n.toLocaleString("id-ID");

const keAngka = (v: number | string | null | undefined): number | undefined => {
	if (v === null || v === undefined || v === "") return undefined;
	const n = typeof v === "number" ? v : Number(v);
	return Number.isFinite(n) ? n : undefined;
};

type CurrencyInputProps = Omit<
	React.ComponentProps<"input">,
	"value" | "onChange" | "type" | "defaultValue"
> & {
	/** Nilai angka murni (tanpa titik). Boleh number atau string angka. */
	value?: number | string | null;
	/** Dipanggil dengan angka murni, atau undefined jika kosong. */
	onValueChange?: (value: number | undefined) => void;
	/** Awalan yang ditampilkan di depan angka. Default "Rp ". */
	prefix?: string;
};

/**
 * Input nominal rupiah: titik ribuan otomatis saat mengetik (Rp 1.250.000),
 * hanya menerima angka, dan mengirim angka murni lewat `onValueChange`.
 * Posisi kursor dijaga saat titik ditambahkan/dihapus.
 */
const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
	({ value, onValueChange, prefix = "Rp ", ...props }, ref) => {
		const inputRef = React.useRef<HTMLInputElement>(null);
		React.useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);
		const pendingDigitsBeforeCaret = React.useRef<number | null>(null);

		const angka = keAngka(value);
		const tampil = angka === undefined ? "" : `${prefix}${formatRibuan(angka)}`;

		// Kembalikan kursor ke posisi yang benar setelah format ulang
		React.useLayoutEffect(() => {
			const digits = pendingDigitsBeforeCaret.current;
			const el = inputRef.current;
			if (digits === null || !el) return;
			pendingDigitsBeforeCaret.current = null;
			let seen = 0;
			let pos = 0;
			while (pos < tampil.length && seen < digits) {
				if (/\d/.test(tampil.charAt(pos))) seen++;
				pos++;
			}
			el.setSelectionRange(pos, pos);
		}, [tampil]);

		const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
			const raw = e.target.value;
			const caret = e.target.selectionStart ?? raw.length;
			pendingDigitsBeforeCaret.current = raw
				.slice(0, caret)
				.replace(/\D/g, "").length;

			const digits = raw.replace(/\D/g, "");
			if (digits === "") {
				onValueChange?.(undefined);
				return;
			}
			onValueChange?.(Math.min(Number(digits), MAX_INT));
		};

		return (
			<Input
				{...props}
				ref={inputRef}
				type="text"
				inputMode="numeric"
				autoComplete="off"
				value={tampil}
				onChange={handleChange}
			/>
		);
	},
);
CurrencyInput.displayName = "CurrencyInput";

export { CurrencyInput };
