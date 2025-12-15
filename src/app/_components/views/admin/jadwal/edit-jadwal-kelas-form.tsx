"use client";

import { Hari, TipeKelas } from "@prisma/client";
import { Clock, Info } from "lucide-react";
import { useEffect, useMemo } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useJam } from "@/hooks/useJam";
import { useKelas } from "@/hooks/useKelas";
import { useRuang } from "@/hooks/useRuang";
import { useGlobalCabangStore } from "@/store/useGlobalCabangStore";
import type { TypeServerUpdateJadwalSchema } from "@/types/jadwalKelas.type";

export default function EditJadwalKelasForm() {
	// 1. Global Filter untuk Dropdown
	const { activeCabangId } = useGlobalCabangStore();

	// 2. Ambil context dari Parent (Drawer)
	const form = useFormContext<TypeServerUpdateJadwalSchema>();
	const { control, setValue } = form;

	// 3. Fetch Data (Filtered by Cabang)
	const { data: dataRuang, isLoading: isLoadingRuang } = useRuang({
		filterCabang: activeCabangId,
	});
	const { dataJamTetap: dataJamSlot, isLoadingJamTetap: isLoadingJamSlot } =
		useJam({ filterCabang: activeCabangId });
	const { dataKelasAktif: dataKelas, isLoadingKelasAktif: isLoadingKelas } =
		useKelas({
			filterCabang: activeCabangId,
			enableQueryGetKelasAktif: true,
		});

	// 4. Watch Fields untuk Logika Dinamis
	const selectedKelasId = useWatch({ control, name: "kelasId" });
	console.log("Selected Kelas ID:", selectedKelasId);
	const selectedRuangId = useWatch({ control, name: "ruangId" });
	const tipeJamValue = useWatch({ control, name: "tipeJam" });

	// 5. Logic Tipe Kelas (Reguler vs Private)
	const selectedKelasInfo = useMemo(
		() => dataKelas?.find((k) => k.id === selectedKelasId),
		[dataKelas, selectedKelasId],
	);
	const isPrivateClass = selectedKelasInfo?.tipe === TipeKelas.PRIVATE;

	useEffect(() => {
		if (selectedKelasInfo) {
			if (isPrivateClass) {
				// Jika kelas privat, paksa ke CUSTOM jika belum
				if (tipeJamValue !== "CUSTOM") {
					setValue("tipeJam", "CUSTOM");
					setValue("jamSlotTetapId", undefined); // Bersihkan field reguler
				}
			} else {
				// Jika kelas reguler, paksa ke TETAP jika belum
				if (tipeJamValue !== "TETAP") {
					setValue("tipeJam", "TETAP");
					setValue("jamMulai", undefined); // Bersihkan field privat
					setValue("jamSelesai", undefined);
				}
			}
		}
	}, [isPrivateClass, selectedKelasInfo, setValue, tipeJamValue]);

	// 6. Filter Slot Jam Tetap berdasarkan Ruang (Cabang)
	const currentCabangId = useMemo(() => {
		return dataRuang?.find((r) => r.id === selectedRuangId)?.cabangId;
	}, [dataRuang, selectedRuangId]);

	const filteredJamSlots = useMemo(() => {
		if (!currentCabangId || !dataJamSlot) return [];
		return dataJamSlot.filter((slot) => slot.cabangId === currentCabangId);
	}, [currentCabangId, dataJamSlot]);

	return (
		<div className="space-y-5">
			{/* Hidden ID */}
			<input type="hidden" {...form.register("id")} />
			{/* Hidden TipeJam (dikontrol useEffect) */}
			<input type="hidden" {...form.register("tipeJam")} />

			{/* -- PILIH KELAS -- */}
			<FormField
				control={control}
				name="kelasId"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Kelas</FormLabel>
						<FormControl>
							<Select
								onValueChange={field.onChange}
								value={field.value}
								disabled={isLoadingKelas}
							>
								<SelectTrigger className="w-full">
									<SelectValue placeholder="Pilih Program Kelas" />
								</SelectTrigger>
								<SelectContent>
									<SelectGroup>
										<SelectLabel>Tipe Program Kelas</SelectLabel>
										{dataKelas?.map((kelas) => (
											<SelectItem key={kelas.id} value={kelas.id}>
												{kelas.kodeKelas}
											</SelectItem>
										))}
									</SelectGroup>
								</SelectContent>
							</Select>
						</FormControl>
						{isPrivateClass ? (
							<Badge variant="secondary" className="mt-1">
								Kelas Privat (Jam Custom)
							</Badge>
						) : (
							<Badge variant="outline" className="mt-1">
								Kelas Reguler (Jam Tetap)
							</Badge>
						)}
						<FormMessage />
					</FormItem>
				)}
			/>

			<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
				{/* -- PILIH RUANG -- */}
				<FormField
					control={control}
					name="ruangId"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Ruang</FormLabel>
							<Select
								onValueChange={field.onChange}
								value={field.value}
								disabled={isLoadingRuang}
							>
								<FormControl>
									<SelectTrigger>
										<SelectValue placeholder="Pilih ruang..." />
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									{dataRuang?.map((ruang) => (
										<SelectItem key={ruang.id} value={ruang.id}>
											{ruang.namaRuang}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<FormMessage />
						</FormItem>
					)}
				/>

				{/* -- PILIH HARI -- */}
				<FormField
					control={control}
					name="hari"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Hari</FormLabel>
							<Select onValueChange={field.onChange} value={field.value}>
								<FormControl>
									<SelectTrigger>
										<SelectValue placeholder="Pilih hari..." />
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									{Object.values(Hari).map((hari) => (
										<SelectItem key={hari} value={hari}>
											{hari}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<FormMessage />
						</FormItem>
					)}
				/>
			</div>

			{/* -- LOGIC JAM (TETAP / CUSTOM) -- */}
			<div className="pt-2">
				{!isPrivateClass ? (
					// REGULER: PILIH SLOT
					<FormField
						control={control}
						name="jamSlotTetapId"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Slot Waktu (Reguler)</FormLabel>
								{!selectedRuangId ? (
									<Alert variant="destructive" className="py-2">
										<Info className="h-4 w-4" />
										<AlertDescription className="text-xs">
											Pilih Ruang terlebih dahulu.
										</AlertDescription>
									</Alert>
								) : isLoadingJamSlot ? (
									<Skeleton className="h-10 w-full" />
								) : filteredJamSlots.length === 0 ? (
									<p className="text-muted-foreground text-sm">
										Tidak ada slot tersedia.
									</p>
								) : (
									<RadioGroup
										onValueChange={field.onChange}
										value={field.value} // Penting: Bind value
										className="grid grid-cols-1 gap-2 sm:grid-cols-2"
									>
										{filteredJamSlots.map((slot) => (
											<FormItem key={slot.id}>
												<Label
													htmlFor={slot.id}
													className={`hover:bg-accent flex cursor-pointer items-center space-x-3 rounded-md border p-3 ${
														field.value === slot.id
															? "bg-primary/5 border-primary"
															: ""
													}`}
												>
													<FormControl>
														<RadioGroupItem value={slot.id} id={slot.id} />
													</FormControl>
													<div className="flex-1 space-y-1">
														<div className="text-sm font-medium">
															{slot.namaSlot}
														</div>
														<div className="text-muted-foreground flex items-center gap-1 text-xs">
															<Clock className="h-3 w-3" />
															{slot.jamMulai} - {slot.jamSelesai}
														</div>
													</div>
												</Label>
											</FormItem>
										))}
									</RadioGroup>
								)}
								<FormMessage />
							</FormItem>
						)}
					/>
				) : (
					// PRIVAT: INPUT MANUAL
					<div className="space-y-4">
						<div className="text-primary flex items-center gap-2 text-sm font-medium">
							<Clock className="h-4 w-4" /> Waktu Custom (Privat)
						</div>
						<div className="grid grid-cols-2 gap-4">
							<FormField
								control={control}
								name="jamMulai"
								render={({ field }) => (
									<FormItem>
										<FormLabel className="text-xs">Jam Mulai</FormLabel>
										<FormControl>
											<Input type="time" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={control}
								name="jamSelesai"
								render={({ field }) => (
									<FormItem>
										<FormLabel className="text-xs">Jam Selesai</FormLabel>
										<FormControl>
											<Input type="time" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>
						<p className="text-muted-foreground text-[10px]">
							*Durasi harus 60 atau 90 menit.
						</p>
					</div>
				)}
			</div>
		</div>
	);
}
