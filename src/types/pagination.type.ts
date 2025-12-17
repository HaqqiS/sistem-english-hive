import { z } from "zod";

export const paginationSchema = z.object({
	pageIndex: z.number().int().min(0).default(0),
	pageSize: z.number().int().min(1).max(200).default(10),
	sorting: z
		.array(
			z.object({
				id: z.string(),
				desc: z.boolean(),
			}),
		)
		.optional(),
});

export type TypePaginationSchema = z.infer<typeof paginationSchema>;
