"use client";

export default function MarqueeBanner() {
	return (
		<div className="relative w-full overflow-hidden py-4">
			{/* Gradient overlay agar terlihat memudar di pinggir */}
			<div className="from-background absolute top-0 bottom-0 left-0 z-10 w-16 bg-linear-to-r to-transparent" />
			<div className="from-background absolute top-0 right-0 bottom-0 z-10 w-16 bg-linear-to-l to-transparent" />

			<div className="animate-marquee flex whitespace-nowrap">
				{/* Kita duplikasi konten beberapa kali agar looping mulus */}
				{[1, 2, 3, 4].map((id) => (
					<div key={id} className="mx-4 flex items-center">
						<span className="text-muted-foreground/70 mx-6 flex items-center gap-2 text-sm font-bold tracking-widest uppercase">
							✨ FLUENT NOW
						</span>
						<span className="text-primary/80 mx-6 flex items-center gap-2 text-sm font-bold tracking-widest uppercase">
							CONFIDENT FOREVER
						</span>
						<span className="text-secondary-foreground/70 mx-6 flex items-center gap-2 text-sm font-bold tracking-widest uppercase">
							WITH ENGLISH HIVE
						</span>
						<span className="text-accent mx-6 flex items-center gap-2 text-sm font-bold tracking-widest uppercase">
							• JOIN US •
						</span>
					</div>
				))}
			</div>

			<style jsx>{`
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          } /* Sesuaikan tergantung panjang konten */
        }
      `}</style>
		</div>
	);
}
