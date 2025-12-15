// src/app/_components/shared/add-drawer.tsx
"use client";

import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerDescription,
	DrawerFooter,
	DrawerHeader,
	DrawerTitle,
	DrawerTrigger,
} from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";

interface AddDrawerProps {
	trigger?: React.ReactNode;
	title: string;
	description?: string;
	children: React.ReactNode;
	onSubmit: () => void;
	isPending?: boolean;
	submitText?: string;
	cancelText?: string;
	triggerText?: string;
	triggerVariant?: "default" | "outline" | "ghost" | "secondary";
	isOpen?: boolean;
	onOpenChange?: (open: boolean) => void;
}

export function AddDrawer({
	trigger,
	title,
	description,
	children,
	onSubmit,
	isPending = false,
	submitText = "Tambah",
	cancelText = "Batal",
	triggerText = "Tambah Data",
	triggerVariant = "default",
	isOpen,
	onOpenChange,
}: AddDrawerProps) {
	const isMobile = useIsMobile();

	// Default trigger button if not provided
	const defaultTrigger = (
		<Button variant={triggerVariant}>
			<Plus className="mr-2 h-4 w-4" />
			{triggerText}
		</Button>
	);

	const triggerElement = trigger ?? defaultTrigger;

	if (isMobile) {
		return (
			<Drawer open={isOpen} onOpenChange={onOpenChange}>
				<DrawerTrigger asChild>{triggerElement}</DrawerTrigger>
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
			<DialogTrigger asChild>{triggerElement}</DialogTrigger>
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
