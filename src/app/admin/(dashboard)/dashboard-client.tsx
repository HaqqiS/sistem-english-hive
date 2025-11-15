"use client";
import { DataTable } from "@/app/_components/shared/data-table-generic";
import { Button } from "@/components/ui/button";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import { columns } from "@/app/_components/views/admin/pembayaran/columns-pembayaran";

export default function DashboardClientPage() {
  const { data: dataPembayaranJatuhTempo } =
    api.pembayaran.getTagihanJatuhTempo.useQuery();

  const pembayaranColumns = columns({
    onDeleteClick: (id: string) => {
      console.log("Delete clicked for pembayaran with id:", id);
    },
    onEditClick: (item) => {
      console.log("Edit clicked for pembayaran:", item);
    },
  });

  return (
    <div>
      <h1>DashboardClientPage</h1>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          onClick={() => toast("Event has been created", { richColors: true })}
        >
          Default
        </Button>
        <Button
          variant="outline"
          onClick={() =>
            toast.success("Event has been created", {
              description: "You can now view the event details.",
              richColors: true,
            })
          }
        >
          Success
        </Button>
        <Button
          variant="outline"
          onClick={() =>
            toast.info("Be at the area 10 minutes before the event time", {
              richColors: true,
            })
          }
        >
          Info
        </Button>
        <Button
          variant="outline"
          onClick={() =>
            toast.warning("Event start time cannot be earlier than 8am", {
              richColors: true,
            })
          }
        >
          Warning
        </Button>
        <Button
          variant="outline"
          onClick={() =>
            toast.error("Event has not been created", { richColors: true })
          }
        >
          Error
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            toast.promise<{ name: string }>(
              () =>
                new Promise((resolve) =>
                  setTimeout(() => resolve({ name: "Event" }), 2000),
                ),
              {
                loading: "Loading...",
                success: (data) => `${data.name} has been created`,
                error: "Error",
                richColors: true,
              },
            );
          }}
        >
          Promise
        </Button>
      </div>

      <DataTable
        data={dataPembayaranJatuhTempo ?? []}
        columns={pembayaranColumns}
      />
    </div>
  );
}
