import { Skeleton } from "@/components/ui/skeleton";

export default function DetailPembayaranMuridLoading() {
  return (
    <div className="flex h-screen">
      {/* <SidebarMenuSkeleton /> */}
      <div className="flex flex-1 flex-col gap-4 p-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-6 w-80" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  );
}
