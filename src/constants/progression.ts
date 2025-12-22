import { JenisKelas } from "@prisma/client";

export const CLASS_PROGRESSION: Record<JenisKelas, JenisKelas | null> = {
	[JenisKelas.TinyTods]: JenisKelas.TinyStar,
	[JenisKelas.TinyStar]: JenisKelas.PreLittleStar,
	[JenisKelas.PreLittleStar]: JenisKelas.LittleStar,
	[JenisKelas.LittleStar]: JenisKelas.RisingStar,
	[JenisKelas.RisingStar]: JenisKelas.PreShiningStar,
	[JenisKelas.PreShiningStar]: JenisKelas.ShiningStar,
	[JenisKelas.ShiningStar]: JenisKelas.Elementary,
	[JenisKelas.Elementary]: null, // End of the line
};
