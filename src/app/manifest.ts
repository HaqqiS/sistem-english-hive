import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
	return {
		name: "English Hive",
		short_name: "English Hive",
		description: "Kursus Bahasa Inggris Terpercaya & Interaktif",
		start_url: "/",
		display: "standalone",
		background_color: "#ffffff",
		theme_color: "#16a34a", // Sesuai dengan warna primary Anda (hijau)
		icons: [
			{
				src: "/favicon.ico",
				sizes: "any",
				type: "image/x-icon",
			},
		],
	};
}
