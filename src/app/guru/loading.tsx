// import { Skeleton } from "@/components/ui/skeleton";

// export default function AdminLoading() {
//   return (
//     <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
//       <header className="flex items-center justify-between pt-6">
//         <div className="flex flex-col gap-2">
//           <Skeleton className="h-6 w-38" />
//           <Skeleton className="h-4 w-68" />
//         </div>
//         <Skeleton className="h-8 w-48" />
//       </header>

//       {/* Placeholder untuk beberapa card */}
//       <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
//         <Skeleton className="h-32 w-full" />
//         <Skeleton className="h-32 w-full" />
//         <Skeleton className="h-32 w-full" />
//       </div>

//       {/* Placeholder untuk tabel */}
//       <Skeleton className="h-screen w-full" />
//     </div>
//   );
// }

import { Skeleton } from "@/components/ui/skeleton";

export default function AdminLoading() {
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
