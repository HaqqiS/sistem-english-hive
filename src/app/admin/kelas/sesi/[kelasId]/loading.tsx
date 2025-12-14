import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

export default function DetailSesiPertemuanKelasLoading() {
	return (
		<Card>
			<CardHeader>
				{/* Title: Detail Sesi: ... */}
				<Skeleton className="mb-2 h-8 w-1/3" />
				{/* Description: Guru Aktif Saat Ini: ... */}
				<Skeleton className="h-5 w-1/4" />
			</CardHeader>
			<CardContent>
				<div className="overflow-x-auto rounded-md border">
					<Table className="min-w-max">
						<TableHeader>
							{/* --- Baris Header 1: Tanggal --- */}
							<TableRow>
								<TableHead
									rowSpan={3}
									className="bg-muted sticky left-0 min-w-40 border-r align-middle"
								>
									<span className="text-transparent">Nama Siswa</span>{" "}
									{/* Placeholder text just for spacing if needed, or leave empty */}
								</TableHead>
								{/* Skeleton Columns for Dates */}
								{Array.from({ length: 3 }).map((_, i) => (
									<TableHead key={i} className="min-w-[100px] p-0 text-center">
										<div className="flex w-full justify-center px-2 py-2.5">
											<Skeleton className="h-4 w-20" />
										</div>
									</TableHead>
								))}
							</TableRow>

							{/* --- Baris Header 2: Pertemuan Ke --- */}
							<TableRow>
								{Array.from({ length: 3 }).map((_, i) => (
									<TableHead key={i} className="text-center">
										<div className="flex justify-center">
											<Skeleton className="h-4 w-24" />
										</div>
									</TableHead>
								))}
							</TableRow>

							{/* --- Baris Header 3: Pengajar --- */}
							<TableRow>
								{Array.from({ length: 3 }).map((_, i) => (
									<TableHead key={i} className="text-center">
										<div className="flex justify-center">
											<Skeleton className="h-4 w-32" />
										</div>
									</TableHead>
								))}
							</TableRow>
						</TableHeader>
						<TableBody>
							{/* Generate 5 skeleton rows for students */}
							{Array.from({ length: 3 }).map((_, rowIndex) => (
								<TableRow key={rowIndex}>
									{/* Kolom Nama Siswa (Sticky) */}
									<TableCell className="bg-background sticky left-0 border-r font-medium">
										<Skeleton className="h-5 w-32" />
									</TableCell>

									{/* Kolom Absensi (Dinamis) */}
									{Array.from({ length: 3 }).map((_, colIndex) => (
										<TableCell key={colIndex} className="text-center">
											<div className="flex justify-center">
												<Skeleton className="h-6 w-8 rounded-full" />{" "}
												{/* Mimics the Badge */}
											</div>
										</TableCell>
									))}
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			</CardContent>
		</Card>
	);
}
