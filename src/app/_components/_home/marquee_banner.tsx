"use client";

export default function MarqueeBanner() {
  return (
    <section className="bg-secondary overflow-hidden py-6">
      <div className="relative flex overflow-x-hidden">
        <div className="animate-marquee flex gap-8 whitespace-nowrap">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex gap-8">
              <span className="text-secondary-foreground text-sm font-bold tracking-wider uppercase">
                ✨ FLUENT NOW
              </span>
              <span className="text-secondary-foreground text-sm font-bold tracking-wider uppercase">
                CONFIDENT FOREVER
              </span>
              <span className="text-secondary-foreground text-sm font-bold tracking-wider uppercase">
                WITH ENGLISH HIVE
              </span>
            </div>
          ))}
        </div>
      </div>
      <style jsx>{`
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-33.333%);
          }
        }
        .animate-marquee {
          animation: marquee 20s linear infinite;
        }
      `}</style>
    </section>
  );
}
