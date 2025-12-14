import { type MetadataRoute } from "next";
import { env } from "@/env";

export default function robots(): MetadataRoute.Robots {
	const baseUrl = env.NEXT_PUBLIC_BASE_URL;

	return {
		rules: {
			userAgent: "*", // Aturan berlaku untuk semua bot
			allow: "/", // Izinkan akses ke semua halaman publik
			disallow: [
				"/admin/", // Jangan indeks halaman admin
				"/guru/", // Jangan indeks halaman guru
				"/api/", // Jangan indeks route API
			],
		},
		sitemap: `${baseUrl}/sitemap.xml`, // Link ke sitemap
	};
}
