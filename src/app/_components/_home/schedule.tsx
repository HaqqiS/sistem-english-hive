"use client";

import { motion, type Variants } from "framer-motion";
import { CalendarDays, Clock, MapPin } from "lucide-react";
import Link from "next/link";
import { ScrollAnimation } from "@/app/_components/shared/scroll-animation";
import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Table,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useScrollDirection } from "@/hooks/use-scroll-direction";

// Data Jadwal Statis
const scheduleData = {
	Gatsu: {
		address:
			"Jl. Gunung Catur, Padang Sambian Kaja, Kec. Denpasar Barat, Kota Denpasar",
		mapLink: "https://maps.app.goo.gl/JFAcnXQNysrjqUQ76",
		schedules: [
			{
				days: "Senin & Kamis",
				sessions: [
					"14.00 - 15.30",
					"15.30 - 17.00",
					"17.00 - 18.30",
					"18.30 - 20.00",
				],
			},
			{
				days: "Selasa & Jumat",
				sessions: [
					"14.00 - 15.30",
					"15.30 - 17.00",
					"17.00 - 18.30",
					"18.30 - 20.00",
				],
			},
			{
				days: "Rabu & Sabtu",
				sessions: [
					"14.00 - 15.30",
					"15.30 - 17.00",
					"17.00 - 18.30",
					"18.30 - 20.00",
				],
			},
		],
	},
	Mambal: {
		address:
			"Jl. Raya Mambal, Ubud, Br. Samu No.8D, Mekar Bhuwana, Kec.Abiansemal, Kabupaten Badung",
		mapLink: "https://maps.app.goo.gl/ixpBYs5gMP2EW5N48",
		schedules: [
			{
				days: "Senin & Kamis",
				sessions: ["14.30 - 16.00", "16.00 - 17.30", "17.30 - 19.00"],
			},
			{
				days: "Selasa & Jumat",
				sessions: ["14.30 - 16.00", "16.00 - 17.30", "17.30 - 19.00"],
			},
			{
				days: "Rabu & Sabtu",
				sessions: ["14.30 - 16.00", "16.00 - 17.30", "17.30 - 19.00"],
			},
		],
	},
};

export default function Schedule() {
	const branches = Object.keys(scheduleData);
	const defaultTab = branches[0];
	const scrollDirection = useScrollDirection();

	// Variants untuk Container (Table Body)
	const containerVariants: Variants = {
		hidden: { opacity: 0 },
		visible: (direction: number) => ({
			opacity: 1,
			transition: {
				staggerChildren: 0.1,
				staggerDirection: direction,
			},
		}),
	};

	// Variants untuk Item (Table Row)
	const itemVariants: Variants = {
		hidden: {
			opacity: 0,
			x: -20,
		},
		visible: {
			opacity: 1,
			x: 0,
			transition: {
				type: "spring",
				stiffness: 50,
				damping: 15,
			},
		},
	};

	return (
		<section className="bg-background py-16 sm:py-24" id="schedule">
			<div className="mx-auto max-w-7xl px-6 lg:px-8">
				{/* Header Animasi */}
				<ScrollAnimation
					variant="fadeUp"
					className="mx-auto mb-10 max-w-2xl text-center"
					once={true}
				>
					<h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
						Jadwal Kelas
					</h2>
					<p className="text-muted-foreground mt-4">
						Pilih cabang terdekat untuk melihat jadwal sesi yang tersedia.
					</p>
				</ScrollAnimation>

				<Tabs defaultValue={defaultTab} className="mx-auto w-full max-w-5xl">
					{/* Tab Navigasi Cabang Animasi */}
					<div className="mb-8 flex justify-center">
						<ScrollAnimation variant="zoomIn" delay={0.1} once={true}>
							<TabsList className="bg-muted/50 flex h-auto flex-wrap justify-center gap-2 rounded-full p-2">
								{branches.map((branch) => (
									<TabsTrigger
										key={branch}
										value={branch}
										className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full px-6 py-2 transition-all data-[state=active]:shadow-md"
									>
										<MapPin className="mr-2 h-4 w-4" />
										{branch}
									</TabsTrigger>
								))}
							</TabsList>
						</ScrollAnimation>
					</div>

					{/* Konten Jadwal Per Cabang */}
					{Object.entries(scheduleData).map(([branchName, data]) => (
						<TabsContent key={branchName} value={branchName}>
							<Card className="border-t-primary border-t-4 shadow-lg">
								<CardHeader className="text-center sm:text-left">
									<div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
										<div>
											<CardTitle className="flex items-center justify-center gap-2 text-2xl sm:justify-start">
												Cabang {branchName}
											</CardTitle>
											<Link
												href={`${data.mapLink}`}
												target="_blank"
												rel="noopener noreferrer"
												className="text-primary hover:underline"
											>
												<CardDescription className="mt-2 flex items-start justify-center gap-2 sm:justify-start">
													<MapPin className="text-muted-foreground h-5 w-5" />
													{data.address}
												</CardDescription>
											</Link>
										</div>
									</div>
								</CardHeader>
								<CardContent>
									<div className="bg-background overflow-hidden rounded-lg border">
										<Table>
											<TableHeader className="bg-muted/30">
												<TableRow>
													<TableHead className="text-primary w-[40%] py-4 text-base font-bold">
														<div className="flex items-center gap-2">
															<CalendarDays className="h-5 w-5" />
															Hari
														</div>
													</TableHead>
													<TableHead className="text-primary py-4 text-base font-bold">
														<div className="flex items-center gap-2">
															<Clock className="h-5 w-5" />
															Pilihan Sesi Waktu
														</div>
													</TableHead>
												</TableRow>
											</TableHeader>

											{/* Animasi diterapkan pada tbody sebagai container */}
											<motion.tbody
												className="[&_tr:last-child]:border-0"
												initial="hidden"
												whileInView="visible"
												viewport={{ once: true, amount: 0.2, margin: "-50px" }}
												custom={scrollDirection}
												variants={containerVariants}
											>
												{data.schedules.map((item) => (
													// Gunakan motion.tr pengganti TableRow untuk animasi item
													<motion.tr
														key={item.days}
														variants={itemVariants}
														className="hover:bg-muted/20 border-b transition-colors"
													>
														<TableCell className="py-6 align-top font-medium">
															<Badge
																variant="secondary"
																className="px-3 py-1 text-sm"
															>
																{item.days}
															</Badge>
														</TableCell>
														<TableCell className="py-6">
															<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
																{item.sessions.map((session) => (
																	<div
																		key={session}
																		className="border-border bg-card text-card-foreground flex items-center gap-2 rounded-md border px-3 py-2 text-sm shadow-sm"
																	>
																		<div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
																		{session}
																	</div>
																))}
															</div>
														</TableCell>
													</motion.tr>
												))}
											</motion.tbody>
										</Table>
									</div>
								</CardContent>
							</Card>
						</TabsContent>
					))}
				</Tabs>
			</div>
		</section>
	);
}
