"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { MuridForAbsensi } from "@/types/absenMurid.type";
import { StatusAbsenMurid } from "@prisma/client";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"; //
import { Label } from "@/components/ui/label"; //
import { type RouterInputs, type RouterOutputs } from "@/trpc/react";
import { Badge } from "@/components/ui/badge";
import type { UseTRPCMutationResult } from "@trpc/react-query/shared";

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
		header: "Status Kehadiran",
		cell: ({ row }) => {
			// Mutasi untuk update absensi
			const { mutate, isPending, variables } = mutation;
			const currentMuridId = row.original.muridId;
			const isThisRowPending =
				isPending && variables?.muridId === currentMuridId;

			// Handler saat radio button diubah
			const handleChange = (value: string) => {
				if (value) {
					mutate({
						sesiId: sesiId,
						muridId: currentMuridId,
						status: value as StatusAbsenMurid,
					});
				}
			};

			return (
				<RadioGroup
					// Gunakan defaultValue agar komponen ter-load dengan status dari DB
					defaultValue={row.original.status ?? ""}
					onValueChange={handleChange}
					className="flex space-x-4"
					disabled={isThisRowPending}
				>
					<div className="flex items-center space-x-2">
						<RadioGroupItem
							value={StatusAbsenMurid.HADIR}
							id={`hadir-${row.original.muridId}`}
						/>
						<Label htmlFor={`hadir-${row.original.muridId}`}>Hadir</Label>
					</div>
					<div className="flex items-center space-x-2">
						<RadioGroupItem
							value={StatusAbsenMurid.ALPA}
							id={`alpa-${row.original.muridId}`}
						/>
						<Label htmlFor={`alpa-${row.original.muridId}`}>Alpa</Label>
					</div>
					<div className="flex items-center space-x-2">
						<RadioGroupItem
							value={StatusAbsenMurid.OFF_SEMENTARA}
							id={`off-${row.original.muridId}`}
						/>
						<Label htmlFor={`off-${row.original.muridId}`}>Off Sementara</Label>
					</div>
					{isThisRowPending && <Badge variant="secondary">Menyimpan...</Badge>}
				</RadioGroup>
			);
		},
	},
];
