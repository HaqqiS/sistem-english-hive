import TambahAbsensi from "@/app/_components/views/guru/tambah-absensi-guru";

export default async function GuruDashboard() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <p></p>
      <TambahAbsensi />
      <div className="bg-muted/50 min-h-screen flex-1 rounded-xl md:min-h-min" />
    </div>
  );
}
