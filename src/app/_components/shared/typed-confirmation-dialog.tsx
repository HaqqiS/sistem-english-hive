"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import {
	AlertDialog,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface TypedConfirmationDialogProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	title: string;
	description: string | React.ReactNode;
	onConfirm: () => Promise<void> | void;
	/** Kata/teks yang harus diketik persis oleh user untuk mengaktifkan tombol konfirmasi */
	confirmationValue: string;
	confirmText?: string;
	cancelText?: string;
	isLoading?: boolean;
}

export function TypedConfirmationDialog({
	isOpen,
	onOpenChange,
	title,
	description,
	onConfirm,
	confirmationValue,
	confirmText = "Hapus",
	cancelText = "Batal",
	isLoading = false,
}: TypedConfirmationDialogProps) {
	const [typedValue, setTypedValue] = useState("");

	// Reset input tiap kali dialog dibuka/ditutup
	useEffect(() => {
		if (!isOpen) {
			setTypedValue("");
		}
	}, [isOpen]);

	const isMatch = typedValue === confirmationValue;

	return (
		<AlertDialog open={isOpen} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>{title}</AlertDialogTitle>
				</AlertDialogHeader>
				<AlertDialogDescription asChild>
					<div className="space-y-3">
						<div>{description}</div>
						<div className="space-y-1.5">
							<p className="text-sm">
								Ketik{" "}
								<span className="text-foreground font-semibold">
									{confirmationValue}
								</span>{" "}
								untuk konfirmasi.
							</p>
							<Input
								autoFocus
								value={typedValue}
								onChange={(e) => setTypedValue(e.target.value)}
								placeholder={confirmationValue}
								disabled={isLoading}
								autoComplete="off"
							/>
						</div>
					</div>
				</AlertDialogDescription>
				<AlertDialogFooter>
					<AlertDialogCancel disabled={isLoading}>
						{cancelText}
					</AlertDialogCancel>
					<Button
						variant="destructive"
						onClick={onConfirm}
						disabled={isLoading || !isMatch}
					>
						{isLoading ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Loading...
							</>
						) : (
							confirmText
						)}
					</Button>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
