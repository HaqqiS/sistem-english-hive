"use client";

import { TipeKelas } from "@prisma/client";
import type { UseFormReturn } from "react-hook-form";
import { Badge } from "@/components/ui/badge";
import {
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";
import type { TypeJenisKelas } from "@/types/jenisKelas.type";
import { toRupiah } from "@/utils/toRupiah";

interface JenisKelasFormProps {
	form: UseFormReturn<TypeJenisKelas>;
	onSubmit: (data: TypeJenisKelas) => void;
}

export function JenisKelasForm({ form, onSubmit }: JenisKelasFormProps) {
	// Fetch existing Jenis Kelas for "Next Level" options
	const { data: jenisKelasList, isLoading: isLoadingList } =
		api.jenisKelas.getJenisKelasList.useQuery();

	// Exclude current selecting (if editing) to avoid self-reference loop
	// (Though simple filter might not catch indirect loops, it's a start)
	// We don't have the current ID readily available in props unless we pass it or read from form values.
	// But let's keep it simple for now.

	return (
		<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
			<FormField
				control={form.control}
				name="nama"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Nama Jenis Kelas</FormLabel>
						<FormControl>
							<Input placeholder="Contoh: TinyTods, Regular" {...field} />
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>

			<div className="grid grid-cols-2 gap-4">
				<FormField
					control={form.control}
					name="tipe"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Tipe Kelas</FormLabel>
							<Select onValueChange={field.onChange} defaultValue={field.value}>
								<FormControl>
									<SelectTrigger className="w-full">
										<SelectValue placeholder="Pilih Tipe" />
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									{Object.values(TipeKelas).map((tipe) => (
										<SelectItem key={tipe} value={tipe}>
											{tipe}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="harga"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Harga (per sesi)</FormLabel>
							<FormControl>
								<Input
									placeholder="0"
									{...field}
									type="text"
									value={field.value ? toRupiah(field.value) : ""}
									onChange={(e) => {
										const val = e.target.value.replace(/[^0-9]/g, "");
										field.onChange(Number(val));
									}}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
			</div>

			<FormField
				control={form.control}
				name="hargaBuku"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Harga Buku</FormLabel>
						<FormControl>
							<Input
								placeholder="120000"
								{...field}
								type="text"
								value={field.value ? toRupiah(field.value) : ""}
								onChange={(e) => {
									const val = e.target.value.replace(/[^0-9]/g, "");
									field.onChange(Number(val));
								}}
							/>
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>

			<FormField
				control={form.control}
				name="nextLevelId"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Level Lanjutan (Next Level)</FormLabel>
						<Select
							onValueChange={(val) =>
								field.onChange(val === "null" ? null : val)
							}
							value={field.value ?? "null"}
							disabled={isLoadingList}
						>
							<FormControl>
								<SelectTrigger className="w-full">
									<SelectValue placeholder="Pilih Next Level (Opsional)" />
								</SelectTrigger>
							</FormControl>
							<SelectContent>
								<SelectItem value="null">
									-- Tidak Ada (Level Tertinggi) --
								</SelectItem>
								{jenisKelasList?.map((jk) => (
									<SelectItem key={jk.id} value={jk.id}>
										<div className="flex items-center gap-2">
											{jk.nama}
											<Badge
												className={cn("text-xs", {
													"bg-teal-500 text-white":
														jk.tipe === TipeKelas.REGULAR,
													"bg-violet-500 text-white":
														jk.tipe === TipeKelas.PRIVATE,
												})}
											>
												{jk.tipe}
											</Badge>
										</div>
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<FormMessage />
					</FormItem>
				)}
			/>

			<FormField
				control={form.control}
				name="deskripsi"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Deskripsi</FormLabel>
						<FormControl>
							<Textarea
								placeholder="Deskripsi singkat mengenai jenis kelas ini..."
								className="resize-none"
								{...field}
								value={field.value ?? ""}
							/>
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>
		</form>
	);
}
