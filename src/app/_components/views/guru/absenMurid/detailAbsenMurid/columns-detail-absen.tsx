"use client";

import { StatusAbsenMurid } from "@prisma/client";
import type { ColumnDef } from "@tanstack/react-table";
import type { UseTRPCMutationResult } from "@trpc/react-query/shared";
import { Check, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { RouterInputs, RouterOutputs } from "@/trpc/react";
import type { MuridForAbsensi } from "@/types/absenMurid.type";

type AbsensiMutation = UseTRPCMutationResult<
	RouterOutputs["absenMurid"]["createOrUpdateAbsensi"],
	unknown,
	RouterInputs["absenMurid"]["createOrUpdateAbsensi"],
	unknown
>;

interface CreateColumnsProps {
	sesiId: string;
	mutation: AbsensiMutation;
}

/**
 * Helper untuk mendapatkan teks dan varian badge berdasarkan status absensi
 */
function getBadgeContent(status: StatusAbsenMurid | null): {
	text: string;
	variant: "default" | "destructive" | "secondary" | "outline";
} {
	switch (status) {
		case StatusAbsenMurid.HADIR:
			return { text: "H", variant: "default" }; // Hijau
		case StatusAbsenMurid.ALPA:
			return { text: "A", variant: "destructive" }; // Merah
		case StatusAbsenMurid.OFF_SEMENTARA:
			return { text: "Off", variant: "secondary" }; // Abu-abu
		default:
			return { text: "-", variant: "outline" }; // Kosong
	}
}

export const createDetailAbsenMuridColumns = ({
	sesiId,
	mutation,
}: CreateColumnsProps): ColumnDef<MuridForAbsensi>[] => [
	{
		accessorKey: "namaLengkap",
		header: "Nama Murid",
		cell: ({ row }) => {
			return <div className="font-medium">{row.original.namaLengkap}</div>;
		},
	},
	{
		accessorKey: "status",
		header: "Status",
		cell: ({ row }) => {
			// Mutasi untuk update absensi
			const { mutate, isPending, variables } = mutation;
			const currentMuridId = row.original.muridId;
			const isThisRowPending =
				isPending && variables?.muridId === currentMuridId;

			// Handler saat status diubah
			const handleChange = (value: string) => {
				if (value) {
					mutate({
						sesiId: sesiId,
						muridId: currentMuridId,
						status: value as StatusAbsenMurid,
					});
				}
			};

			const status = row.original.status as StatusAbsenMurid | null;
			const { text, variant } = getBadgeContent(status);

			return (
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							variant={variant}
							className={`h-7 w-9 p-0 text-xs ${status === null ? "opacity-50" : ""}`}
							disabled={isThisRowPending}
						>
							{isThisRowPending ? (
								<Loader2 className="h-3 w-3 animate-spin" />
							) : (
								text
							)}
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="center">
						<DropdownMenuItem
							onClick={() => handleChange(StatusAbsenMurid.HADIR)}
						>
							<div className="flex items-center gap-2">
								<Badge variant="default" className="w-5 justify-center">
									H
								</Badge>{" "}
								Hadir
								{status === StatusAbsenMurid.HADIR && (
									<Check className="h-3 w-3 ml-auto" />
								)}
							</div>
						</DropdownMenuItem>
						<DropdownMenuItem
							onClick={() => handleChange(StatusAbsenMurid.ALPA)}
						>
							<div className="flex items-center gap-2">
								<Badge variant="destructive" className="w-5 justify-center">
									A
								</Badge>{" "}
								Alpa
								{status === StatusAbsenMurid.ALPA && (
									<Check className="h-3 w-3 ml-auto" />
								)}
							</div>
						</DropdownMenuItem>
						<DropdownMenuItem
							onClick={() => handleChange(StatusAbsenMurid.OFF_SEMENTARA)}
						>
							<div className="flex items-center gap-2">
								<Badge variant="secondary" className="w-5 justify-center">
									O
								</Badge>{" "}
								Off
								{status === StatusAbsenMurid.OFF_SEMENTARA && (
									<Check className="h-3 w-3 ml-auto" />
								)}
							</div>
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			);
		},
	},
];
