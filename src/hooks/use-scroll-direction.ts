"use client";

import { useScroll, useVelocity } from "framer-motion";
import { useEffect, useState } from "react";

/**
 * Hook untuk mendeteksi arah scroll pengguna.
 * Mengembalikan 1 jika scroll ke bawah, -1 jika scroll ke atas.
 */
export function useScrollDirection() {
	const { scrollY } = useScroll();
	const scrollVelocity = useVelocity(scrollY);
	const [scrollDirection, setScrollDirection] = useState(1); // Default: 1 (Down)

	useEffect(() => {
		const unsubscribe = scrollVelocity.on("change", (latest) => {
			if (latest > 0) {
				setScrollDirection(1); // Scrolling Down
			} else if (latest < 0) {
				setScrollDirection(-1); // Scrolling Up
			}
		});
		return () => unsubscribe();
	}, [scrollVelocity]);

	return scrollDirection;
}
