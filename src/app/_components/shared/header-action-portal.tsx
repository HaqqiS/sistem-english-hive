"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

export const HeaderActionPortal = ({ children }: { children: ReactNode }) => {
	// 1. State untuk memastikan kode hanya jalan di client (setelah hydration)
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
		return () => setMounted(false);
	}, []);

	// 2. Jangan render apa-apa di server atau saat first render client
	if (!mounted) return null;

	const portalContainer = document.getElementById("header-actions");

	if (!portalContainer) {
		console.warn("Target container #header-actions not found");
		return null;
	}

	// 3. Render ke target
	return createPortal(children, portalContainer);
};
