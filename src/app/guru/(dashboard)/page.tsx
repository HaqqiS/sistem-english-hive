import { LatestPost } from "@/app/_components/shared/post";
import { auth } from "@/server/auth";
import { api, HydrateClient } from "@/trpc/server";
import Link from "next/link";

export default async function GuruDashboard() {
  const hello = await api.post.hello({ text: "from tRPC" });
  const session = await auth();

  if (session?.user) {
    void api.post.getLatest.prefetch();
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <p>
        <Link href="/guru/posts/create">Buat Postingan Baru</Link>
      </p>
      <div className="bg-muted/50 min-h-screen flex-1 rounded-xl md:min-h-min" />
    </div>
  );
}
