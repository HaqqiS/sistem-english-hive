"use client";

import { Loader2, Users } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { usePendaftaranKelas } from "@/hooks/usePendaftaranKelas";
import { cn } from "@/lib/utils";

interface MuridPopoverProps {
	kelasId: string;
	jumlahMurid: number;
	className?: string;
}

export function MuridPopover({
	kelasId,
	jumlahMurid,
	className,
}: MuridPopoverProps) {
	const [isOpen, setIsOpen] = useState(false);

	// Menggunakan dataByKelasId (getPendaftarByKelasId) agar mendapatkan status pendaftaran
	const { dataByKelasId: listPendaftaran, isLoadingByKelasId: isLoading } =
		usePendaftaranKelas({
			kelasId,
			enableQuery: isOpen,
		});

	return (
		<Popover open={isOpen} onOpenChange={setIsOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="secondary"
					size="sm"
					className={cn(
						"h-7 gap-1.5 rounded-full px-3 text-xs font-semibold transition-all hover:bg-secondary/80 active:scale-95",
						isOpen && "bg-secondary ring-2 ring-primary/20",
						className,
					)}
				>
					<Users className="h-3.5 w-3.5" />
					<span>{jumlahMurid} Murid</span>
				</Button>
			</PopoverTrigger>
			<PopoverContent
				className="w-auto min-w-[240px] max-w-[calc(100vw-32px)] p-3 sm:max-w-md"
				align="end"
				sideOffset={10}
			>
				<div className="flex flex-col space-y-2.5">
					<div className="flex items-center justify-between border-b pb-2">
						<h4 className="flex items-center gap-2 text-sm font-semibold leading-none">
							<Users className="h-4 w-4 text-primary" />
							Daftar Murid
						</h4>
						<Badge variant="outline" className="h-5 px-1.5 text-[10px]">
							{jumlahMurid} Total
						</Badge>
					</div>

					{isLoading ? (
						<div className="flex items-center justify-center py-6">
							<Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
						</div>
					) : listPendaftaran && listPendaftaran.length > 0 ? (
						<ul className="custom-scrollbar flex max-h-56 flex-col gap-1 overflow-y-auto pr-1 text-sm">
							{listPendaftaran
								.filter((p) => ["AKTIF", "TRIAL"].includes(p.status))
								.map((p) => {
									return (
										<li
											key={p.id}
											className="flex items-center justify-between rounded-lg p-1.5 transition-colors hover:bg-muted/50"
										>
											<div className="flex items-center gap-2.5 overflow-hidden">
												<div className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary/40" />
												<span className="truncate font-medium">
													{p.murid.namaLengkap}
												</span>
											</div>
											<Badge
												variant={p.status === "AKTIF" ? "default" : "secondary"}
												className="h-4 px-1 text-[9px] font-bold uppercase"
											>
												{p.status}
											</Badge>
										</li>
									);
								})}
						</ul>
					) : (
						<div className="py-4 text-center text-sm text-muted-foreground">
							Belum ada murid.
						</div>
					)}
				</div>
			</PopoverContent>
		</Popover>
	);
}
