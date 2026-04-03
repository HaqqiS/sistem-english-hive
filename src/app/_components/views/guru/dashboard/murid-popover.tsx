"use client";

import { Loader2, Users } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { usePendaftaranKelas } from "@/hooks/usePendaftaranKelas";

interface MuridPopoverProps {
	kelasId: string;
	jumlahMurid: number;
}

export function MuridPopover({ kelasId, jumlahMurid }: MuridPopoverProps) {
	const [isOpen, setIsOpen] = useState(false);

	// Fetch dipicu HANYA JIKA popover terbuka.
	const { dataMuridNames: listMurid, isLoadingMuridNames: isLoading } =
		usePendaftaranKelas({
			kelasId,
			enableMuridNamesQuery: isOpen,
		});

	return (
		<Popover open={isOpen} onOpenChange={setIsOpen}>
			<PopoverTrigger asChild>
				<Badge
					variant="secondary"
					className="cursor-pointer hover:bg-secondary/80 flex items-center gap-1.5 py-1 px-2.5 transition-colors"
				>
					<Users className="h-3.5 w-3.5" />
					<span className="font-medium text-xs">{jumlahMurid} Murid</span>
				</Badge>
			</PopoverTrigger>
			<PopoverContent className="w-64 p-3" align="start" sideOffset={8}>
				<div className="flex flex-col space-y-2">
					<h4 className="font-medium text-sm leading-none flex items-center gap-2 mb-1">
						<Users className="h-4 w-4 text-primary" />
						Daftar Murid Terdaftar
					</h4>
					<hr className="border-border" />

					{isLoading ? (
						<div className="flex items-center justify-center p-4">
							<Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
						</div>
					) : listMurid && listMurid.length > 0 ? (
						<ul className="text-sm text-foreground flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
							{listMurid.map((m) => (
								<li key={m.id} className="flex items-center gap-2">
									<div className="h-1.5 w-1.5 rounded-full bg-primary/40 shrink-0" />
									<span className="truncate">{m.namaLengkap}</span>
								</li>
							))}
						</ul>
					) : (
						<div className="text-sm text-muted-foreground py-2 text-center">
							Belum ada murid.
						</div>
					)}
				</div>
			</PopoverContent>
		</Popover>
	);
}
