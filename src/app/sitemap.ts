import { type MetadataRoute } from "next";
import { env } from "@/env";

export default function sitemap(): MetadataRoute.Sitemap {
	const baseUrl: string = env.NEXT_PUBLIC_BASE_URL ?? "";

	return [
		{
			url: baseUrl,
			lastModified: new Date(),
			changeFrequency: "monthly",
			priority: 1,
		},
		{
			url: `${baseUrl}/auth/login`,
			lastModified: new Date(),
			changeFrequency: "yearly",
			priority: 0.8,
		},
		// Rute lainnya...
	];
}
