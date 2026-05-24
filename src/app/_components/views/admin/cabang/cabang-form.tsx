"use client";

import { useFormContext } from "react-hook-form";
import {
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { TypeClientCabangSchema } from "@/types/cabang.type";

interface CabangFormProps {
	onSubmit: (data: TypeClientCabangSchema) => void;
}

export default function CabangForm({ onSubmit }: CabangFormProps) {
	const form = useFormContext<TypeClientCabangSchema>();

	return (
		<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
			{/* Nama Cabang */}
			<FormField
				control={form.control}
				name="namaCabang"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Nama Cabang</FormLabel>
						<FormControl>
							<Input
								placeholder="Masukkan nama cabang"
								{...field}
								required
								autoFocus
							/>
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>

			{/* Alamat */}
			<FormField
				control={form.control}
				name="alamat"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Alamat</FormLabel>
						<FormControl>
							<Input placeholder="Masukkan alamat cabang" {...field} required />
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>

			{/* No Telepon */}
			<FormField
				control={form.control}
				name="noTelp"
				render={({ field }) => (
					<FormItem>
						<FormLabel>No Telepon</FormLabel>
						<FormControl>
							<Input
								placeholder="Masukkan no telepon cabang"
								{...field}
								required
							/>
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>

			{/* Email */}
			<FormField
				control={form.control}
				name="email"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Email</FormLabel>
						<FormControl>
							<Input
								type="email"
								placeholder="Masukkan email cabang"
								{...field}
							/>
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>

			{/* No Rekening */}
			<FormField
				control={form.control}
				name="noRekening"
				render={({ field }) => (
					<FormItem>
						<FormLabel>No Rekening</FormLabel>
						<FormControl>
							<Input placeholder="Masukkan no Rekening cabang" {...field} />
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>

			{/* Bank */}
			<FormField
				control={form.control}
				name="bank"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Bank</FormLabel>
						<FormControl>
							<Input
								placeholder="Masukkan nama bank (mis: BCA, Mandiri)"
								{...field}
							/>
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>

			{/* Atas Nama */}
			<FormField
				control={form.control}
				name="atasNama"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Atas Nama Rekening</FormLabel>
						<FormControl>
							<Input placeholder="Masukkan nama pemilik rekening" {...field} />
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>
		</form>
	);
}
