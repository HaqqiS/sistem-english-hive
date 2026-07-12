"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface SalinTeksButtonProps {
	text: string;
	disabled?: boolean;
}

export default function SalinTeksButton({
	text,
	disabled,
}: SalinTeksButtonProps) {
	const [copied, setCopied] = useState(false);

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(text);
			setCopied(true);
			toast.success("Teks pesan berhasil disalin");
			setTimeout(() => setCopied(false), 2000);
		} catch {
			toast.error("Gagal menyalin teks");
		}
	};

	return (
		<Button
			type="button"
			variant="outline"
			size="sm"
			disabled={disabled}
			onClick={handleCopy}
			className="gap-1 border-slate-200 text-slate-600 hover:bg-slate-50"
			title="Salin Teks Pesan"
		>
			{copied ? (
				<Check className="h-4 w-4 text-green-600" />
			) : (
				<Copy className="h-4 w-4" />
			)}
			<span className="hidden xl:inline">Salin Teks</span>
		</Button>
	);
}
