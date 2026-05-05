"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

// Peta untuk mengganti nama segmen teknis ke nama tampilan yang ramah user
const RENAME_MAP: Record<string, string> = {
	guru: "Guru",
	pembayaran: "Pembayaran",
	kelas: "Kelas",
	verifikasi: "Verifikasi",
	absen: "Absensi",
};

// Fungsi helper untuk membuat huruf pertama kapital
function capitalize(str: string) {
	if (!str) return str;
	return str.charAt(0).toUpperCase() + str.slice(1);
}

export function DynamicBreadcrumb() {
	const pathname = usePathname(); // Cth: /admin/verivikasi
	const segments = pathname.split("/").filter(Boolean); // Cth: ["admin", "verivikasi"]

	if (pathname === "/admin" || pathname === "/guru") {
		return (
			<Breadcrumb>
				<BreadcrumbList>
					<BreadcrumbItem>
						<BreadcrumbPage>Dashboard</BreadcrumbPage>
					</BreadcrumbItem>
				</BreadcrumbList>
			</Breadcrumb>
		);
	}

	// Buat daftar breadcrumb secara dinamis
	let lastLabel = "";
	let labelPrefix = "Detail "; // Default prefix untuk ID
	const breadcrumbItems: { segment: string; path: string; label: string }[] =
		[];

	for (let i = 0; i < segments.length; i++) {
		const segment = segments[i] as string;
		const path = `/${segments.slice(0, i + 1).join("/")}`;

		if (segment === "detail") {
			labelPrefix = "Detail ";
			continue;
		}

		if (segment === "sesi") {
			labelPrefix = "Detail Sesi ";
			continue;
		}

		if (segment === "rekap") {
			labelPrefix = "Rekap ";
			continue;
		}

		let label = "";
		if (segment.length > 10) {
			// Jika segmen adalah ID, gabungkan prefix dengan label parent terakhir
			label = `${labelPrefix}${lastLabel}`;
			// Reset prefix ke default setelah digunakan
			labelPrefix = "Detail ";
		} else {
			// Gunakan RENAME_MAP atau capitalize
			label = RENAME_MAP[segment] || capitalize(segment);
			lastLabel = label;
		}

		breadcrumbItems.push({ segment, path, label });
	}

	return (
		<Breadcrumb>
			<BreadcrumbList>
				{breadcrumbItems.map((item, index) => {
					const isLast = index === breadcrumbItems.length - 1;

					return (
						<React.Fragment key={item.path}>
							<BreadcrumbItem className={!isLast ? "hidden sm:flex" : ""}>
								{isLast ? (
									<BreadcrumbPage>{item.label}</BreadcrumbPage>
								) : (
									<BreadcrumbLink asChild>
										<Link href={item.path}>{item.label}</Link>
									</BreadcrumbLink>
								)}
							</BreadcrumbItem>
							{!isLast && <BreadcrumbSeparator className="hidden sm:flex" />}
						</React.Fragment>
					);
				})}
			</BreadcrumbList>
		</Breadcrumb>
	);
}
