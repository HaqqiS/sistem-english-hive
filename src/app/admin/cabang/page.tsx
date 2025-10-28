import TambahCabang from "./tambah-cabang";

export default function CabangPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <header className="flex items-center justify-between pt-6">
        <div>
          <h1 className="text-xl">CabangPage</h1>
          <p className="text-muted-foreground text-sm">
            This is the cabang management page.
          </p>
        </div>
        <TambahCabang />
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="bg-muted/50 min-h-screen rounded-xl"></div>
      </main>
    </div>
  );
}
