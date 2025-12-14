// src/app/_components/shared/edit-drawer.tsx
"use client";

import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerDescription,
	DrawerFooter,
	DrawerHeader,
	DrawerTitle,
} from "@/components/ui/drawer";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

interface EditDrawerProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	title: string;
	description?: string;
	children: React.ReactNode;
	onSubmit: () => void;
	isPending?: boolean;
	submitText?: string;
	cancelText?: string;
}

export function EditDrawer({
	isOpen,
	onOpenChange,
	title,
	description,
	children,
	onSubmit,
	isPending = false,
	submitText = "Simpan Perubahan",
	cancelText = "Batal",
}: EditDrawerProps) {
	const isMobile = useIsMobile();

	if (isMobile) {
		return (
			<Drawer open={isOpen} onOpenChange={onOpenChange}>
				<DrawerContent>
					<DrawerHeader className="gap-1">
						<DrawerTitle>{title}</DrawerTitle>
						{description && (
							<DrawerDescription>{description}</DrawerDescription>
						)}
					</DrawerHeader>

					<div className="flex flex-col gap-4 overflow-y-auto px-4">
						{children}
					</div>

					<DrawerFooter>
						<Button type="submit" onClick={onSubmit} disabled={isPending}>
							{isPending ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Menyimpan...
								</>
							) : (
								submitText
							)}
						</Button>
						<DrawerClose asChild>
							<Button variant="outline" disabled={isPending}>
								{cancelText}
							</Button>
						</DrawerClose>
					</DrawerFooter>
				</DrawerContent>
			</Drawer>
		);
	}

	return (
		<Dialog open={isOpen} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[500px]">
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					{description && <DialogDescription>{description}</DialogDescription>}
				</DialogHeader>

				<div className="flex max-h-[60vh] flex-col gap-4 overflow-y-auto">
					{children}
				</div>

				<DialogFooter>
					<DialogClose asChild>
						<Button variant="outline" disabled={isPending}>
							{cancelText}
						</Button>
					</DialogClose>
					<Button type="submit" onClick={onSubmit} disabled={isPending}>
						{isPending ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Menyimpan...
							</>
						) : (
							submitText
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
