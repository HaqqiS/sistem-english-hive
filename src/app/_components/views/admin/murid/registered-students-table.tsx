import { Calendar, Clock, MessageCircle, User } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import type { RouterOutputs } from "@/trpc/react";

type KelasWithActiveStudents =
	RouterOutputs["murid"]["getKelasWithActiveStudents"][number];

interface RegisteredStudentsTableProps {
	data: KelasWithActiveStudents[];
	isLoading: boolean;
}

export function RegisteredStudentsTable({
	data,
	isLoading,
}: RegisteredStudentsTableProps) {
	if (isLoading) {
		return <div className="p-4 text-center">Loading data...</div>;
	}

	if (!data || data.length === 0) {
		return (
			<div className="p-8 text-center text-muted-foreground border rounded-lg">
				Belum ada kelas dengan murid aktif.
			</div>
		);
	}

	return (
		<div className="rounded-md border mt-4">
			<Table>
				<TableHeader>
					<TableRow className="bg-muted/50">
						<TableHead>Info Kelas</TableHead>
						<TableHead>Nama Murid</TableHead>
						<TableHead>Umur & Kelas Sekolah</TableHead>
						<TableHead>WA Action</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{data.map((kelas) => {
						const students = kelas.pendaftaranKelases.map((p) => p.murid);
						if (students.length === 0) return null;

						return (
							<TableRow
								key={kelas.id}
								className="align-top hover:bg-transparent group"
							>
								{/* INFO KELAS */}
								<TableCell className="align-middle  border-r bg-muted/5 group-hover:bg-muted/10 transition-colors">
									<div className="flex flex-col gap-3">
										<div className="flex flex-col">
											<span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
												Kode Kelas
											</span>
											<span className="font-bold text-lg text-primary">
												{kelas.kodeKelas}
											</span>
										</div>

										<div className="flex items-center gap-2 text-sm text-foreground/80 mt-1">
											<User className="h-4 w-4 text-muted-foreground" />
											<span className="font-medium">
												{kelas.historyGuruKelases[0]?.guru.name ??
													"Belum ada guru"}
											</span>
										</div>

										<div className="flex flex-col gap-1.5">
											<div className="flex items-center gap-2 text-sm font-medium">
												<Calendar className="h-4 w-4 text-muted-foreground" />
												<span>Jadwal:</span>
											</div>
											{kelas.jadwalKelas.map((jadwal) => {
												const timeString = jadwal.jamSlotTetap
													? `${jadwal.jamSlotTetap.jamMulai} - ${jadwal.jamSlotTetap.jamSelesai}`
													: jadwal.jamSlotCustom
														? `${jadwal.jamSlotCustom.jamMulai} - ${jadwal.jamSlotCustom.jamSelesai}`
														: "-";

												return (
													<div
														key={jadwal.id}
														className="flex items-center gap-2 ml-1 text-sm text-muted-foreground"
													>
														<Badge
															variant="outline"
															className="text-xs px-1.5 py-0 h-5 font-normal"
														>
															{jadwal.hari}
														</Badge>
														<span className="flex items-center gap-1">
															<Clock className="h-3 w-3" />
															{timeString} | {jadwal.ruang.namaRuang}
														</span>
													</div>
												);
											})}
										</div>
									</div>
								</TableCell>

								{/* LIST NAMA */}
								<TableCell className="align-top p-0 border-r">
									<div className="flex flex-col divide-y">
										{students.map((student) => (
											<div
												key={student.id}
												className="h-[50px] flex items-center px-4 font-medium"
											>
												{student.namaLengkap}
											</div>
										))}
									</div>
								</TableCell>

								{/* UMUR & KELAS SEKOLAH */}
								<TableCell className="align-top p-0 border-r">
									<div className="flex flex-col divide-y">
										{students.map((student) => (
											<div
												key={student.id}
												className="h-[50px] flex items-center px-4 gap-3"
											>
												<Badge variant="outline" className="bg-background">
													{student.umur} Thn
												</Badge>
												<span className="text-muted-foreground">
													{student.kelasSekolah || "-"}
												</span>
											</div>
										))}
									</div>
								</TableCell>

								{/* WA ACTION */}
								<TableCell className="align-top p-0">
									<div className="flex flex-col divide-y">
										{students.map((student) => (
											<div
												key={student.id}
												className="h-[50px] flex items-center justify-center px-4"
											>
												{student.noWA ? (
													<div>
														<Button
															asChild
															variant="outline"
															size="icon-sm"
															className="h-8 w-8 border-green-200 text-green-600 hover:bg-green-50"
															title="Hubungi via WhatsApp"
														>
															<Link
																href={`https://wa.me/${student.noWA}`}
																target="_blank"
																rel="noopener noreferrer"
															>
																<MessageCircle className="h-4 w-4" />
															</Link>
														</Button>
													</div>
												) : (
													<span className="text-muted-foreground text-xs opacity-50">
														-
													</span>
												)}
											</div>
										))}
									</div>
								</TableCell>
							</TableRow>
						);
					})}
				</TableBody>
			</Table>
		</div>
	);
}
