"use client";

import {
	IconBrandFacebook,
	IconBrandInstagram,
	IconBrandTiktok,
} from "@tabler/icons-react";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { ScrollAnimation } from "@/app/_components/shared/scroll-animation";

export default function Footer() {
	return (
		<footer className="bg-card text-card-foreground border-border border-t">
			<div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
				{/* Main Footer Content with Stagger Animation */}
				<ScrollAnimation
					variant="stagger"
					className="mb-8 grid grid-cols-1 gap-8 md:grid-cols-4"
					viewportAmount={0.2}
					once={true}
				>
					{/* About */}
					<ScrollAnimation variant="fadeUp" className="space-y-4">
						<div className="text-primary flex items-center gap-2 text-lg font-bold">
							{/* <Bee className="h-5 w-5" /> */}
							<Image
								src="/logo_hijau2.webp"
								alt="English Hive Logo"
								width={40}
								height={40}
								className="object-contain"
							/>
							<span>English Hive</span>
						</div>
						<p className="text-muted-foreground text-sm">
							Lembaga kursus bahasa Inggris terpercaya dengan metode
							pembelajaran interaktif dan tutor berpengalaman.
						</p>
						<div className="flex gap-4">
							<Link
								href="https://www.instagram.com/englishhive_eh8/"
								target="_blank"
								className="text-muted-foreground hover:text-primary transition-colors"
							>
								<IconBrandInstagram stroke={1.5} />
							</Link>
							<Link
								href="https://www.facebook.com/people/English-Hive/61581964621366/"
								target="_blank"
								className="text-muted-foreground hover:text-primary transition-colors"
							>
								<IconBrandFacebook stroke={1.5} />
							</Link>
							<Link
								href="https://www.tiktok.com/@englishhive_eh8"
								target="_blank"
								className="text-muted-foreground hover:text-primary transition-colors"
							>
								<IconBrandTiktok stroke={1.5} />
							</Link>
							{/* <Link
                href="#"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Linkedin className="h-5 w-5" />
              </Link> */}
						</div>
					</ScrollAnimation>

					{/* Programs */}
					<ScrollAnimation variant="fadeUp" className="space-y-4">
						<h3 className="font-semibold">Program</h3>
						<ul className="space-y-2 text-sm">
							<li>
								<Link
									href="#programs"
									className="text-muted-foreground hover:text-primary transition-colors"
								>
									TinyTods
								</Link>
							</li>
							<li>
								<Link
									href="#programs"
									className="text-muted-foreground hover:text-primary transition-colors"
								>
									PreLittleStar
								</Link>
							</li>
							<li>
								<Link
									href="#programs"
									className="text-muted-foreground hover:text-primary transition-colors"
								>
									LittleStar
								</Link>
							</li>
							<li>
								<Link
									href="#programs"
									className="text-muted-foreground hover:text-primary transition-colors"
								>
									RisingStar
								</Link>
							</li>
							<li>
								<Link
									href="#programs"
									className="text-muted-foreground hover:text-primary transition-colors"
								>
									PreShiningStar
								</Link>
							</li>
							<li>
								<Link
									href="#programs"
									className="text-muted-foreground hover:text-primary transition-colors"
								>
									ShiningStar
								</Link>
							</li>
							<li>
								<Link
									href="#programs"
									className="text-muted-foreground hover:text-primary transition-colors"
								>
									Elementary
								</Link>
							</li>
						</ul>
					</ScrollAnimation>

					{/* Company */}
					<ScrollAnimation variant="fadeUp" className="space-y-4">
						<h3 className="font-semibold">Perusahaan</h3>
						<ul className="space-y-2 text-sm">
							<li>
								<Link
									href="#about"
									className="text-muted-foreground hover:text-primary transition-colors"
								>
									Tentang Kami
								</Link>
							</li>
							<li>
								<Link
									href="#"
									className="text-muted-foreground hover:text-primary transition-colors"
								>
									Tutor Kami
								</Link>
							</li>
							<li>
								<Link
									href="#"
									className="text-muted-foreground hover:text-primary transition-colors"
								>
									Testimoni
								</Link>
							</li>
							<li>
								<Link
									href="#"
									className="text-muted-foreground hover:text-primary transition-colors"
								>
									Blog
								</Link>
							</li>
							<li>
								<Link
									href="#"
									className="text-muted-foreground hover:text-primary transition-colors"
								>
									Karir
								</Link>
							</li>
						</ul>
					</ScrollAnimation>

					{/* Contact */}
					<ScrollAnimation variant="fadeUp" className="space-y-4">
						<h3 className="font-semibold">Kontak</h3>
						<ul className="space-y-3 text-sm">
							<li className="flex items-start gap-3">
								<MapPin className="text-primary mt-0.5 h-4 w-4 shrink-0" />
								<Link
									href={"https://maps.app.goo.gl/JFAcnXQNysrjqUQ76"}
									target="_blank"
								>
									<span className="text-muted-foreground">
										Jl. Gunung Catur, Padang Sambian Kaja, Kec. Denpasar Barat,
										Kota Denpasar
									</span>
								</Link>
							</li>
							<li className="flex items-start gap-3">
								<MapPin className="text-primary mt-0.5 h-4 w-4 shrink-0" />
								<Link
									href={"https://maps.app.goo.gl/ixpBYs5gMP2EW5N48"}
									target="_blank"
								>
									<span className="text-muted-foreground">
										Jl. Raya Mambal, Ubud, Br. Samu No.8D, Mekar Bhuwana, Kec.
										Abiansemal, Kabupaten Badung
									</span>
								</Link>
							</li>
							<li className="flex items-center gap-3">
								<Phone className="text-primary h-4 w-4 shrink-0" />
								<span className="text-muted-foreground">
									+62 895-8035-12835
								</span>
							</li>
							<li className="flex items-center gap-3">
								<Mail className="text-primary h-4 w-4 shrink-0" />
								<span className="text-muted-foreground">
									englishhivelearn@gmail.com
								</span>
							</li>
							<li className="flex items-start gap-3">
								<Clock className="text-primary mt-0.5 h-4 w-4 shrink-0" />
								<div className="text-muted-foreground">
									<div>Senin - Sabtu: 09:00 - 20:00</div>
								</div>
							</li>
						</ul>
					</ScrollAnimation>
				</ScrollAnimation>

				{/* Bottom Bar */}
				<ScrollAnimation
					variant="fadeIn"
					delay={0.2}
					once={true}
					className="border-border border-t pt-8"
				>
					<div className="flex flex-col items-center justify-between gap-4 md:flex-row">
						<p className="text-muted-foreground text-sm">
							© 2025 English Hive. All rights reserved.
						</p>
						<div className="flex gap-6 text-sm">
							<Link
								href="#"
								className="text-muted-foreground hover:text-primary transition-colors"
							>
								Privacy Policy
							</Link>
							<Link
								href="#"
								className="text-muted-foreground hover:text-primary transition-colors"
							>
								Terms of Service
							</Link>
							<Link
								href="#"
								className="text-muted-foreground hover:text-primary transition-colors"
							>
								Cookie Policy
							</Link>
						</div>
					</div>
				</ScrollAnimation>
			</div>
		</footer>
	);
}
