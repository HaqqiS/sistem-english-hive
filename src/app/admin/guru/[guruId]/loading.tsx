import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function DetailGuruLoading() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <main className="flex flex-1 flex-col gap-4 pt-6">
        <div className="space-y-4">
          {/* --- HEADER SECTION --- */}
          <header className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <div>
              {/* Title: Gaji Guru: ... */}
              <Skeleton className="h-8 w-64" />
              {/* Subtitle: Periode ... */}
              <Skeleton className="mt-2 h-4 w-48" />
            </div>

            {/* Filter Bulan Gaji */}
            <div className="flex flex-col gap-1">
              {/* Label */}
              <Skeleton className="h-3 w-24" />
              {/* Button Trigger */}
              <Skeleton className="h-10 w-full rounded-md md:w-60" />
            </div>
          </header>

          {/* --- KARTU RANGKUMAN GAJI --- */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              {/* Card Title */}
              <Skeleton className="h-5 w-40" />
              {/* Rate Badge */}
              <Skeleton className="h-6 w-24 rounded-md" />
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 pt-4 md:grid-cols-2">
              {/* Box 1: Total Sesi */}
              <div className="bg-background rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-28" />
                </div>
                <Skeleton className="mt-2 h-8 w-20" />
                <Skeleton className="mt-2 h-3 w-40" />
              </div>

              {/* Box 2: Total Gaji */}
              <div className="bg-secondary rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="mt-2 h-8 w-32" />
                <Skeleton className="mt-2 h-3 w-48" />
              </div>
            </CardContent>
            <CardFooter>
              {/* Refresh Button */}
              <Skeleton className="ml-auto h-9 w-24" />
            </CardFooter>
          </Card>

          {/* --- TABEL RINCIAN ABSENSI --- */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-36" />
              <Skeleton className="mt-1 h-4 w-64" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Toolbar Tabel (View Options) */}
                <div className="flex items-center justify-between">
                  {/* <Skeleton className="h-10 w-[150px] sm:w-[250px]" /> */}
                  <Skeleton className="h-6 w-[140px]" />
                </div>

                {/* Tabel Header & Rows */}
                <div className="rounded-md border">
                  {/* Header */}
                  <div className="bg-muted/50 h-8 border-b" />
                  {/* Rows Mockup */}
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-4 border-b p-2 last:border-0"
                    >
                      <Skeleton className="h-4 w-4" /> {/* Checkbox */}
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-[200px]" />
                      </div>
                      <div className="ml-auto hidden gap-2 md:flex">
                        <Skeleton className="h-6 w-20 rounded-full" />
                        <Skeleton className="h-8 w-8" />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between px-2">
                  <Skeleton className="h-4 w-[150px]" />
                  <div className="flex items-center space-x-2">
                    <Skeleton className="hidden h-8 w-20 md:flex" />
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="hidden h-8 w-20 md:flex" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
