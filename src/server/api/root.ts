import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";
import { absenGuruRouter } from "./routers/absenGuru.router";
import { absenMuridRouter } from "./routers/absenMurid.router";
import { cabangRouter } from "./routers/cabang.router";
import { dashboardRouter } from "./routers/dashboard.router";
import { historyGuruKelasRouter } from "./routers/historyGuruKelas.router";
import { jadwalKelasRouter } from "./routers/jadwalKelas.router";
import { jamRouter } from "./routers/jam.router";
import { jenisKelasRouter } from "./routers/jenisKelas.router";
import { kelasRouter } from "./routers/kelas.router";
import { muridRouter } from "./routers/murid.router";
import { pembayaranRouter } from "./routers/pembayaran.router";
import { pendaftaranKelasRouter } from "./routers/pendaftaranKelas.router";
import { ruangRouter } from "./routers/ruang.router";
import { sesiPertemuanRouter } from "./routers/sesiPertemuan.router";
import { userRouter } from "./routers/user.router";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
	user: userRouter,
	absenGuru: absenGuruRouter,
	cabang: cabangRouter,
	ruang: ruangRouter,
	kelas: kelasRouter,
	sesiPertemuan: sesiPertemuanRouter,
	murid: muridRouter,
	pendaftaranKelas: pendaftaranKelasRouter,
	absenMurid: absenMuridRouter,
	historyGuruKelas: historyGuruKelasRouter,
	pembayaran: pembayaranRouter,
	jam: jamRouter,
	jadwalKelas: jadwalKelasRouter,
	dashboard: dashboardRouter,
	jenisKelas: jenisKelasRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
