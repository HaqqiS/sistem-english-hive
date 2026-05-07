"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		console.error(error);
	}, [error]);

	return (
		<div className="flex min-h-screen flex-col items-center justify-center gap-4">
			<h2 className="text-2xl font-bold">Terjadi Kesalahan!</h2>
			<p className="text-muted-foreground text-center max-w-md">
				{process.env.NODE_ENV === "production"
					? error.message.includes(":\\") ||
						error.message.includes("/") ||
						error.message.toLowerCase().includes("database") ||
						error.message.toLowerCase().includes("prisma")
						? "Terjadi kesalahan pada sistem. Silakan coba lagi nanti atau hubungi admin."
						: error.message || "Something went wrong"
					: error.message || "Something went wrong"}
			</p>
			<Button onClick={() => reset()}>Coba Lagi</Button>
		</div>
	);
}
