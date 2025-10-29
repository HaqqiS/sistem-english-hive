import { Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const pricingTiers = [
  {
    name: "Basic",
    price: "Rp 500.000",
    period: "/bulan",
    description:
      "Cocok untuk pemula yang ingin memulai perjalanan belajar bahasa Inggris",
    features: [
      "8 sesi per bulan",
      "Kelas grup (max 10 siswa)",
      "Materi digital",
      "Progress tracking",
      "Certificate of completion",
    ],
    popular: false,
  },
  {
    name: "Premium",
    price: "Rp 900.000",
    period: "/bulan",
    description: "Paket paling populer dengan fitur lengkap dan fleksibel",
    features: [
      "12 sesi per bulan",
      "Kelas grup kecil (max 6 siswa)",
      "Materi digital + printed",
      "Free conversation club",
      "Progress tracking",
      "Certificate + badge",
      "1 session tutor consultation",
    ],
    popular: true,
  },
  {
    name: "VIP",
    price: "Rp 1.500.000",
    period: "/bulan",
    description: "Pengalaman belajar premium dengan perhatian maksimal",
    features: [
      "16 sesi per bulan",
      "Private/semi-private class",
      "Customized curriculum",
      "All learning materials",
      "Unlimited conversation club",
      "Priority scheduling",
      "Personal learning coach",
      "Mock tests (TOEFL/IELTS)",
      "Lifetime alumni access",
    ],
    popular: false,
  },
];

export default function Pricing() {
  return (
    <section
      id="pricing"
      className="bg-muted/30 px-4 py-16 sm:px-6 lg:px-8 lg:py-24"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold text-balance sm:text-4xl lg:text-5xl">
            Paket Investasi Belajar
          </h2>
          <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
            Pilih paket yang sesuai dengan budget dan kebutuhan Anda
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {pricingTiers.map((tier, index) => (
            <Card
              key={index}
              className={`relative flex flex-col transition-all duration-300 ${
                tier.popular
                  ? "border-primary border-2 shadow-xl md:scale-105"
                  : "border-border border"
              }`}
            >
              {tier.popular && (
                <Badge className="bg-primary absolute -top-3 left-1/2 -translate-x-1/2">
                  Most Popular
                </Badge>
              )}

              <CardHeader>
                <CardTitle className="text-2xl">{tier.name}</CardTitle>
                <p className="text-muted-foreground mt-2 text-sm">
                  {tier.description}
                </p>
              </CardHeader>

              <CardContent className="flex-1 space-y-6">
                <div>
                  <div className="text-primary text-4xl font-bold">
                    {tier.price}
                  </div>
                  <div className="text-muted-foreground text-sm">
                    {tier.period}
                  </div>
                </div>

                <ul className="space-y-3">
                  {tier.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Check className="text-primary mt-0.5 h-5 w-5 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className="w-full"
                  variant={tier.popular ? "default" : "outline"}
                  size="lg"
                >
                  Pilih Paket
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="bg-background border-border mt-12 rounded-lg border p-6 text-center">
          <p className="text-muted-foreground text-sm">
            <span className="text-foreground font-semibold">
              Semua paket termasuk:
            </span>{" "}
            Akses platform online 24/7, Progress report bulanan, Sertifikat
            penyelesaian
          </p>
        </div>
      </div>
    </section>
  );
}
