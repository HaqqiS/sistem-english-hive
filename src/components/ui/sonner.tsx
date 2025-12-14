"use client";

import {
	CircleCheckIcon,
	InfoIcon,
	Loader2Icon,
	OctagonXIcon,
	TriangleAlertIcon,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
	const { theme = "system" } = useTheme();

	return (
		<Sonner
			theme={theme as ToasterProps["theme"]}
			className="toaster group"
			icons={{
				success: <CircleCheckIcon className="size-4" />,
				info: <InfoIcon className="size-4" />,
				warning: <TriangleAlertIcon className="size-4" />,
				error: <OctagonXIcon className="size-4" />,
				loading: <Loader2Icon className="size-4 animate-spin" />,
			}}
			style={
				// {
				//   "--normal-bg": "var(--popover)",
				//   "--normal-text": "var(--popover-foreground)",
				//   "--normal-border": "var(--border)",
				//   "--border-radius": "var(--radius)",
				// } as React.CSSProperties

				{
					"--border-radius": "var(--radius)",

					// Normal
					"--normal-bg": "var(--popover)",
					"--normal-text": "var(--popover-foreground)",
					"--normal-border": "var(--border)",

					// Success (Kita gunakan --primary dari theme Anda)
					"--success-bg": "var(--primary)",
					"--success-text": "var(--primary-foreground)",
					"--success-border": "var(--border)",

					// Error (Kita gunakan --destructive dari theme Anda)
					"--error-bg": "var(--destructive)",
					"--error-text": "var(--destructive-foreground)",
					"--error-border": "var(--border)",

					// Info (Kita gunakan --accent dari theme Anda)
					"--info-bg": "var(--accent)",
					"--info-text": "var(--accent-foreground)",
					"--info-border": "var(--border)",

					// Warning (Kita gunakan --secondary dari theme Anda, atau --accent)
					"--warning-bg": "var(--secondary)",
					"--warning-text": "var(--secondary-foreground)",
					"--warning-border": "var(--border)",
				} as React.CSSProperties
			}
			{...props}
		/>
	);
};

export { Toaster };
