"use client";

import { type HTMLMotionProps, motion, type Variants } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ScrollAnimationProps extends HTMLMotionProps<"div"> {
	children: ReactNode;
	className?: string;
	delay?: number;
	duration?: number;
	viewportAmount?: number;
	/**
	 * Jika true, animasi hanya berjalan sekali saat elemen masuk viewport.
	 * Sangat disarankan 'true' untuk performa dan kenyamanan membaca (Visual Fatigue).
	 * Default: true
	 */
	once?: boolean;
	variant?:
		| "fadeUp"
		| "fadeIn"
		| "fadeLeft"
		| "fadeRight"
		| "zoomIn"
		| "stagger";
}

export function ScrollAnimation({
	children,
	className,
	delay = 0,
	duration = 0.5,
	viewportAmount = 0.2,
	once = true, // PERFORMANCE FIX: Default ke true
	variant = "fadeUp",
	...props
}: ScrollAnimationProps) {
	const getVariants = (): Variants => {
		switch (variant) {
			case "stagger":
				return {
					hidden: { opacity: 0 },
					visible: {
						opacity: 1,
						transition: {
							staggerChildren: 0.15,
							delayChildren: delay,
						},
					},
				};
			case "fadeLeft":
				return {
					hidden: { opacity: 0, x: -40 },
					visible: {
						opacity: 1,
						x: 0,
						transition: {
							type: "spring",
							damping: 25,
							stiffness: 100,
							duration,
							delay,
						},
					},
				};
			case "fadeRight":
				return {
					hidden: { opacity: 0, x: 40 },
					visible: {
						opacity: 1,
						x: 0,
						transition: {
							type: "spring",
							damping: 25,
							stiffness: 100,
							duration,
							delay,
						},
					},
				};
			case "zoomIn":
				return {
					hidden: { opacity: 0, scale: 0.9 },
					visible: {
						opacity: 1,
						scale: 1,
						transition: {
							type: "spring",
							damping: 20,
							stiffness: 100,
							duration,
							delay,
						},
					},
				};
			case "fadeIn":
				return {
					hidden: { opacity: 0 },
					visible: {
						opacity: 1,
						transition: { duration, delay, ease: "easeOut" },
					},
				};
			case "fadeUp":
				return {
					hidden: { opacity: 0, y: 40 },
					visible: {
						opacity: 1,
						y: 0,
						transition: {
							type: "spring",
							damping: 25,
							stiffness: 100,
							duration,
							delay,
						},
					},
				};
			default:
				return {
					hidden: { opacity: 0, y: 40 },
					visible: {
						opacity: 1,
						y: 0,
						transition: {
							type: "spring",
							damping: 25,
							stiffness: 100,
							duration,
							delay,
						},
					},
				};
		}
	};

	return (
		<motion.div
			initial="hidden"
			whileInView="visible"
			viewport={{ once: once, amount: viewportAmount, margin: "-50px" }}
			variants={getVariants()}
			className={cn(className)}
			{...props}
		>
			{children}
		</motion.div>
	);
}
