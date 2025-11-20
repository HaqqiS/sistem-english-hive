import DashboardClientPage from "./dashboard-client";

export default function AdminDashboardPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <main className="flex flex-1 flex-col gap-4 pt-0">
        <DashboardClientPage />
      </main>
    </div>
  );
}
