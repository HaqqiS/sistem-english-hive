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
			<p className="text-muted-foreground">
				{error.message || "Something went wrong"}
			</p>
			<Button onClick={() => reset()}>Coba Lagi</Button>
		</div>
	);
}
