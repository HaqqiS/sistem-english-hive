"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { DateTimeDatePicker } from "@/app/_components/shared/DateTimeDatePicker";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useSesiPertemuan } from "@/hooks/useSesiPertemuan";

interface EditSesiDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	sesiId: string | null;
	initialDate: Date | null;
	kelasId: string;
}

export default function EditSesiDialog({
	open,
	onOpenChange,
	sesiId,
	initialDate,
	kelasId,
}: EditSesiDialogProps) {
	const [editDateValue, setEditDateValue] = useState<Date | null>(null);

	const { mutations } = useSesiPertemuan({
		kelasId: kelasId,
	});

	// Sync local state when initialDate changes
	useEffect(() => {
		setEditDateValue(initialDate);
	}, [initialDate]);

	const handleSaveDate = async () => {
		if (!sesiId || !editDateValue) return;

		try {
			await mutations.update.mutateAsync({
				id: sesiId,
				tanggalWaktu: editDateValue,
			});
			onOpenChange(false);
		} catch (_error) {
			// Error handled in hook
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Edit Sesi Pertemuan</DialogTitle>
					<DialogDescription>
						Ubah tanggal dan waktu untuk sesi pertemuan ini.
					</DialogDescription>
				</DialogHeader>
				<div className="grid gap-4 py-4">
					<div className="flex flex-col gap-2">
						<Label htmlFor="datetime">Tanggal Sesi</Label>
						<DateTimeDatePicker
							value={editDateValue}
							onChange={(date) => setEditDateValue(date)}
						/>
					</div>
				</div>
				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						Batal
					</Button>
					<Button
						onClick={handleSaveDate}
						disabled={mutations.update.isPending}
					>
						{mutations.update.isPending && (
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						)}
						Simpan Perubahan
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
