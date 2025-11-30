"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { api } from "@/trpc/react";
import { Loader2, MapPin, CalendarDays } from "lucide-react";
import { ScrollAnimation } from "@/app/_components/shared/scroll-animation";

export default function Schedule() {
  // 1. Fetch Data Cabang (Untuk Tabs)
  const { data: cabangList, isLoading: loadingCabang } =
    api.cabang.getAllList.useQuery();

  // 2. Fetch Semua Jadwal
  const { data: jadwalList, isLoading: loadingJadwal } =
    api.jadwalKelas.getAll.useQuery();

  // State untuk Tab Aktif (Default ke cabang pertama jika ada)
  // Kita gunakan useEffect atau logic derived state sederhana
  // Jika cabangList belum load, value default string kosong.

  const defaultTab = cabangList?.[0]?.id;

  return (
    <section className="bg-background py-16 sm:py-24" id="schedule">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* <div className="mx-auto mb-10 max-w-2xl text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl font-bold tracking-tight sm:text-4xl"
          >
            Jadwal Kelas
          </motion.h2>
          <p className="text-muted-foreground mt-4">
            Cek ketersediaan jadwal di cabang terdekat Anda.
            <br />
            <span className="text-xs italic">
              *Jadwal Private dapat disesuaikan (Flexible)
            </span>
          </p>
        </div> */}

        <ScrollAnimation
          variant="fadeUp"
          className="mx-auto mb-10 max-w-2xl text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Jadwal Kelas
          </h2>
          <p className="text-muted-foreground mt-4">
            Cek ketersediaan jadwal di cabang terdekat Anda.
            <br />
            <span className="text-xs italic">
              *Jadwal Private dapat disesuaikan (Flexible)
            </span>
          </p>
        </ScrollAnimation>

        {/* Loading State */}
        {(loadingCabang || loadingJadwal) && (
          <div className="flex justify-center py-12">
            <Loader2 className="text-primary h-8 w-8 animate-spin" />
          </div>
        )}

        {/* Content */}
        {cabangList && jadwalList && (
          <Tabs defaultValue={defaultTab} className="mx-auto w-full max-w-4xl">
            <div className="mb-8 flex justify-center">
              <TabsList className="bg-muted/50 flex h-auto flex-wrap gap-2 p-2">
                {cabangList.map((cabang) => (
                  <TabsTrigger
                    key={cabang.id}
                    value={cabang.id}
                    className="px-6 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
                  >
                    <MapPin className="mr-2 h-4 w-4" />
                    {cabang.namaCabang}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {cabangList.map((cabang) => {
              // Filter jadwal berdasarkan cabang
              // Asumsi: relasi jadwal -> ruang -> cabang
              const jadwalDiCabang = jadwalList.filter(
                (j) => j.ruang.cabang?.namaCabang === cabang.namaCabang,
                // Catatan: Idealnya filter by ID jika data relasi mengembalikan ID cabang.
                // Berdasarkan router Anda: include: { ruang: { include: { cabang: true } } }
                // Cek output JSON dari trpc router Anda untuk memastikan path object-nya.
                // Jika router 'getAll' mengembalikan `ruang: { select: { cabang: { select: { namaCabang: true } } } }`
                // Maka logic di atas sudah benar (filter by string name), atau lebih aman fetch cabangId di router.
              );

              // Mengurutkan hari: Senin -> Minggu
              const sorter = {
                SENIN: 1,
                SELASA: 2,
                RABU: 3,
                KAMIS: 4,
                JUMAT: 5,
                SABTU: 6,
                MINGGU: 7,
              };

              const sortedJadwal = [...jadwalDiCabang].sort((a, b) => {
                return (
                  (sorter[a.hari as keyof typeof sorter] || 0) -
                  (sorter[b.hari as keyof typeof sorter] || 0)
                );
              });

              return (
                <TabsContent key={cabang.id} value={cabang.id}>
                  {/* <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  > */}
                  <ScrollAnimation
                    variant="fadeUp"
                    delay={0.2}
                    className="mx-auto w-full max-w-5xl"
                  >
                    <Card>
                      <CardHeader>
                        <CardTitle>Jadwal {cabang.namaCabang}</CardTitle>
                        <CardDescription>{cabang.alamat}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {sortedJadwal.length > 0 ? (
                          <div className="overflow-hidden rounded-md border">
                            <Table>
                              <TableHeader className="bg-muted">
                                <TableRow>
                                  <TableHead className="w-[120px]">
                                    Hari
                                  </TableHead>
                                  <TableHead>Waktu</TableHead>
                                  <TableHead>Kelas</TableHead>
                                  <TableHead className="text-right">
                                    Ruang
                                  </TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {sortedJadwal.map((item) => {
                                  // Handle logic jam Tetap vs Custom
                                  const jamMulai =
                                    item.jamSlotTetap?.jamMulai ??
                                    item.jamSlotCustom?.jamMulai ??
                                    "-";
                                  const jamSelesai =
                                    item.jamSlotTetap?.jamSelesai ??
                                    item.jamSlotCustom?.jamSelesai ??
                                    "-";
                                  const isPrivate = !!item.jamSlotCustom;

                                  return (
                                    <TableRow key={item.id}>
                                      <TableCell className="font-medium">
                                        <Badge variant="outline">
                                          {item.hari}
                                        </Badge>
                                      </TableCell>
                                      <TableCell>
                                        {jamMulai} - {jamSelesai} WIB
                                      </TableCell>
                                      <TableCell>
                                        <div className="flex flex-col">
                                          <span className="font-semibold">
                                            {item.kelas.kodeKelas}
                                          </span>
                                          <span className="text-muted-foreground text-xs capitalize">
                                            {item.kelas.jenisKelas
                                              .toLowerCase()
                                              .replace("_", " ")}
                                            {isPrivate && " (Privat)"}
                                          </span>
                                        </div>
                                      </TableCell>
                                      <TableCell className="text-right">
                                        {item.ruang.namaRuang}
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          </div>
                        ) : (
                          <div className="text-muted-foreground py-10 text-center">
                            <CalendarDays className="mx-auto mb-3 h-10 w-10 opacity-20" />
                            <p>Belum ada jadwal terdaftar untuk cabang ini.</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </ScrollAnimation>

                  {/* </motion.div> */}
                </TabsContent>
              );
            })}
          </Tabs>
        )}
      </div>
    </section>
  );
}
