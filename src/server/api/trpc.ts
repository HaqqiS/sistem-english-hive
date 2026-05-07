/**
 * YOU PROBABLY DON'T NEED TO EDIT THIS FILE, UNLESS:
 * 1. You want to modify request context (see Part 1).
 * 2. You want to create a new middleware or type of procedure (see Part 3).
 *
 * TL;DR - This is where all the tRPC server stuff is created and plugged in. The pieces you will
 * need to use are documented accordingly near the end.
 */

import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";

import { auth } from "@/server/auth";
import { UserRole } from "@/server/auth/type";
import { db } from "@/server/db";

/**
 * 1. CONTEXT
 *
 * This section defines the "contexts" that are available in the backend API.
 *
 * These allow you to access things when processing a request, like the database, the session, etc.
 *
 * This helper generates the "internals" for a tRPC context. The API handler and RSC clients each
 * wrap this and provides the required context.
 *
 * @see https://trpc.io/docs/server/context
 */
export const createTRPCContext = async (opts: { headers: Headers }) => {
	const session = await auth();
	// const { req, res } = opts;
	// console.log("Session in TRPC context:", session);

	return {
		db,
		session,
		...opts,
	};
};

/**
 * 2. INITIALIZATION
 *
 * This is where the tRPC API is initialized, connecting the context and transformer. We also parse
 * ZodErrors so that you get typesafety on the frontend if your procedure fails due to validation
 * errors on the backend.
 */
const t = initTRPC.context<typeof createTRPCContext>().create({
	transformer: superjson,
	errorFormatter({ shape, error }) {
		const isProduction = process.env.NODE_ENV === "production";
		const message =
			isProduction &&
			(shape.message.includes(":\\") ||
				shape.message.includes("/") ||
				shape.message.toLowerCase().includes("database") ||
				shape.message.toLowerCase().includes("prisma"))
				? "Internal server error"
				: shape.message;

		return {
			...shape,
			message,
			data: {
				...shape.data,
				zodError:
					error.cause instanceof ZodError ? error.cause.flatten() : null,
			},
		};
	},
});

/**
 * Create a server-side caller.
 *
 * @see https://trpc.io/docs/server/server-side-calls
 */
export const createCallerFactory = t.createCallerFactory;

/**
 * 3. ROUTER & PROCEDURE (THE IMPORTANT BIT)
 *
 * These are the pieces you use to build your tRPC API. You should import these a lot in the
 * "/src/server/api/routers" directory.
 */

/**
 * This is how you create new routers and sub-routers in your tRPC API.
 *
 * @see https://trpc.io/docs/router
 */
export const createTRPCRouter = t.router;

/**
 * Middleware for timing procedure execution and adding an artificial delay in development.
 *
 * You can remove this if you don't like it, but it can help catch unwanted waterfalls by simulating
 * network latency that would occur in production but not in local development.
 */
const timingMiddleware = t.middleware(async ({ next, path }) => {
	const start = Date.now();

	if (t._config.isDev) {
		// artificial delay in dev
		const waitMs = Math.floor(Math.random() * 400) + 100;
		await new Promise((resolve) => setTimeout(resolve, waitMs));
	}

	const result = await next();

	const end = Date.now();
	const durationMs = end - start;
	console.log(`[TRPC] ${path} took ${durationMs}ms to execute`);

	return result;
});

/**
 * Rate Limiter Middleware
 * Uses in-memory limiter. Note: In serverless (Vercel), this memory is ephemeral per lambda instance.
 * For robust production rate limiting, use Redis (upstash/ratelimit).
 */
import { RateLimiterMemory } from "rate-limiter-flexible";

const rateLimiter = new RateLimiterMemory({
	points: 10, // 10 requests
	duration: 1, // Per second
});

const rateLimitMiddleware = t.middleware(async ({ ctx, next }) => {
	const userId = ctx.session?.user?.id ?? "ip_based_limit"; // Fallback if no session (IP handling requires more context)

	try {
		// Consuming 1 point per request
		await rateLimiter.consume(userId, 1);
	} catch (_rejRes) {
		throw new TRPCError({
			code: "TOO_MANY_REQUESTS",
			message: "Too many requests. Please try again later.",
		});
	}
	return next();
});

/**
 * Public (unauthenticated) procedure
 *
 * This is the base piece you use to build new queries and mutations on your tRPC API. It does not
 * guarantee that a user querying is authorized, but you can still access user session data if they
 * are logged in.
 */
export const publicProcedure = t.procedure.use(timingMiddleware);

/**
 * Protected (authenticated) procedure
 *
 * If you want a query or mutation to ONLY be accessible to logged in users, use this. It verifies
 * the session is valid and guarantees `ctx.session.user` is not null.
 *
 * @see https://trpc.io/docs/procedures
 */
export const protectedProcedure = t.procedure
	.use(timingMiddleware)
	.use(rateLimitMiddleware)
	.use(({ ctx, next }) => {
		if (!ctx.session?.user) {
			throw new TRPCError({ code: "UNAUTHORIZED" });
		}
		return next({
			ctx: {
				// infers the `session` as non-nullable
				session: { ...ctx.session, user: ctx.session.user },
			},
		});
	});

/**
 * Manager Only Procedure
 */
export const managerProcedure = protectedProcedure.use(({ ctx, next }) => {
	if (ctx.session.user.role !== UserRole.MANAGER) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "Akses ditolak. Khusus Manager.",
		});
	}
	return next({ ctx });
});

/**
 * Cabang Protected Procedure
 * - Otomatis mendeteksi role user.
 * - Jika Admin/Guru: Membatasi akses hanya ke cabang mereka sendiri via `ctx.allowedCabangId`.
 * - Jika Manager: Mengecek input `cabangId` (jika ada) untuk filter, atau membiarkan null (All).
 */
export const cabangProtectedProcedure = protectedProcedure.use(async (opts) => {
	// biome-ignore lint/suspicious/noExplicitAny: Accessing internal rawInput which is not typed by tRPC
	const rawInput = (opts as any).rawInput;
	const { ctx, next } = opts;
	const { role, cabangId } = ctx.session.user;
	let allowedCabangId: string | undefined;

	if (role === UserRole.ADMIN || role === UserRole.GURU) {
		// Enforce cabang mereka sendiri
		if (!cabangId) {
			throw new TRPCError({
				code: "FORBIDDEN",
				message: "Akun Anda tidak terhubung dengan cabang manapun.",
			});
		}
		allowedCabangId = cabangId;
	} else if (role === UserRole.MANAGER) {
		// Cek apakah input memiliki property cabangId
		// Kita lakukan pengecekan loose pada rawInput karena tipe input belum divalidasi Zod di level middleware
		if (rawInput && typeof rawInput === "object" && "cabangId" in rawInput) {
			const inputArg = rawInput as { cabangId?: string | null };
			if (inputArg.cabangId && inputArg.cabangId !== "ALL") {
				allowedCabangId = inputArg.cabangId;
			}
		}
	}

	return next({
		ctx: {
			...ctx,
			allowedCabangId,
		},
	});
});
