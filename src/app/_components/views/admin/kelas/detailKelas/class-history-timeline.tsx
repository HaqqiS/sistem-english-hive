"use client";

import { api } from "@/trpc/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, Clock, GraduationCap, Users } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ClassHistoryTimelineProps {
  cohortId: string;
  currentKelasId?: string; // Untuk highlight kelas yang sedang dibuka
}

export function ClassHistoryTimeline({
  cohortId,
  currentKelasId,
}: ClassHistoryTimelineProps) {
  const { data: history, isLoading } = api.kelas.getKelasHistory.useQuery(
    { cohortId },
    { enabled: !!cohortId },
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (!history || history.length === 0) {
    return (
      <div className="text-muted-foreground py-8 text-center text-sm italic">
        Belum ada riwayat kenaikan kelas.
      </div>
    );
  }

  return (
    <div className="border-muted relative ml-3 space-y-8 border-l-2 pt-2 pl-8">
      {history.map((item, index) => {
        const isCurrent = item.id === currentKelasId;
        const isPast =
          !isCurrent &&
          index < history.findIndex((h) => h.id === currentKelasId);
        // const isFuture = !isCurrent && !isPast;

        return (
          <div key={item.id} className="relative">
            {/* Dot Indicator */}
            <span
              className={cn(
                "ring-background absolute top-1 -left-[41px] flex h-6 w-6 items-center justify-center rounded-full ring-4",
                isCurrent
                  ? "bg-primary text-primary-foreground"
                  : isPast
                    ? "bg-muted-foreground text-white"
                    : "bg-muted text-muted-foreground",
              )}
            >
              {isCurrent ? (
                <Clock className="h-3 w-3" />
              ) : (
                <CheckCircle2 className="h-3 w-3" />
              )}
            </span>

            {/* Content Card */}
            <Card
              className={cn(
                "transition-all hover:shadow-md",
                isCurrent ? "border-primary/50 shadow-sm" : "opacity-90",
              )}
            >
              <CardHeader className="pt-4 pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                      Level {item.level}
                    </span>
                    <CardTitle className="text-base">
                      <Link
                        href={`/admin/kelas/${item.id}`}
                        className="hover:text-primary underline-offset-4 hover:underline"
                      >
                        {item.kodeKelas}
                      </Link>
                    </CardTitle>
                  </div>
                  {isCurrent && (
                    <Badge variant="default" className="ml-2">
                      Aktif
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pb-4">
                <div className="text-muted-foreground flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1.5">
                    <GraduationCap className="h-4 w-4" />
                    <span>{item.bulanTahunAjar}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users className="h-4 w-4" />
                    <span>{item._count.pendaftaranKelases} Siswa</span>
                  </div>
                </div>

                {/* Tombol lihat detail jika bukan halaman aktif */}
                {!isCurrent && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground mt-2 h-7 px-2 text-xs"
                    asChild
                  >
                    <Link href={`/admin/kelas/${item.id}`}>Lihat Detail</Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        );
      })}
    </div>
  );
}
