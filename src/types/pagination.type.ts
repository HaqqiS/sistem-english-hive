import { z } from "zod";

export const paginationSchema = z.object({
	pageIndex: z.number().int().min(0).default(0),
	pageSize: z.number().int().min(1).max(50).default(10),
});

export type TypePaginationSchema = z.infer<typeof paginationSchema>;
