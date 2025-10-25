"use client";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/app/_components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/_components/ui/table";

const scheduleData = {
  weekday: [
    {
      time: "08:00 - 10:00",
      class: "General English (Beginner)",
      days: "Senin & Rabu",
    },
    {
      time: "10:00 - 12:00",
      class: "Business English",
      days: "Selasa & Kamis",
    },
    {
      time: "13:00 - 15:00",
      class: "TOEFL Preparation",
      days: "Senin - Kamis",
    },
    { time: "16:00 - 18:00", class: "Kids & Teens", days: "Senin - Jumat" },
    {
      time: "19:00 - 21:00",
      class: "General English (Intermediate)",
      days: "Selasa & Kamis",
    },
  ],
  weekend: [
    { time: "08:00 - 10:00", class: "IELTS Preparation", days: "Sabtu" },
    {
      time: "10:00 - 12:00",
      class: "General English (All Levels)",
      days: "Sabtu & Minggu",
    },
    { time: "13:00 - 15:00", class: "Conversation Club", days: "Sabtu" },
    {
      time: "15:00 - 17:00",
      class: "Business English Intensive",
      days: "Sabtu & Minggu",
    },
  ],
};

export default function Schedule() {
  return (
    <section
      id="schedule"
      className="bg-background px-4 py-16 sm:px-6 lg:px-8 lg:py-24"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold text-balance sm:text-4xl lg:text-5xl">
            Jadwal Kelas
          </h2>
          <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
            Pilih waktu yang paling sesuai dengan aktivitas Anda
          </p>
        </div>

        <Tabs defaultValue="weekday" className="w-full">
          <TabsList className="mx-auto mb-8 grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="weekday">Hari Kerja</TabsTrigger>
            <TabsTrigger value="weekend">Akhir Pekan</TabsTrigger>
          </TabsList>

          <TabsContent value="weekday" className="space-y-4">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Waktu</TableHead>
                    <TableHead>Kelas</TableHead>
                    <TableHead>Hari</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scheduleData.weekday.map((item, index) => (
                    <TableRow
                      key={index}
                      className={index % 2 === 0 ? "bg-muted/30" : ""}
                    >
                      <TableCell className="font-semibold">
                        {item.time}
                      </TableCell>
                      <TableCell>{item.class}</TableCell>
                      <TableCell>{item.days}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="weekend" className="space-y-4">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Waktu</TableHead>
                    <TableHead>Kelas</TableHead>
                    <TableHead>Hari</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scheduleData.weekend.map((item, index) => (
                    <TableRow
                      key={index}
                      className={index % 2 === 0 ? "bg-muted/30" : ""}
                    >
                      <TableCell className="font-semibold">
                        {item.time}
                      </TableCell>
                      <TableCell>{item.class}</TableCell>
                      <TableCell>{item.days}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>

        <div className="bg-muted/30 border-border text-muted-foreground mt-8 rounded-lg border p-4 text-center text-sm">
          Jadwal dapat disesuaikan dengan kebutuhan kelas private/semi-private
        </div>
      </div>
    </section>
  );
}
