import ChangePasswordForm from "@/app/_components/shared/profile/change-password-form";
import EditProfileForm from "@/app/_components/shared/profile/edit-profile-form";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function AdminProfilePage() {
	return (
		<div className="flex-1 space-y-4 p-4 pt-6">
			<div className="flex items-center justify-between space-y-2">
				<div className="space-y-1">
					<h2 className="text-3xl font-bold tracking-tight">Profil Saya</h2>
					<p className="text-muted-foreground">
						Kelola informasi profil dan keamanan akun Anda.
					</p>
				</div>
			</div>
			<Separator />

			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
				{/* Edit Profil - 3 cols */}
				<Card className="col-span-3">
					<CardHeader>
						<CardTitle>Informasi Profil</CardTitle>
						<CardDescription>
							Perbarui nama dan email akun Anda.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<EditProfileForm />
					</CardContent>
				</Card>

				{/* Ubah Password - 3 cols */}
				<Card className="col-span-3">
					<CardHeader>
						<CardTitle>Keamanan</CardTitle>
						<CardDescription>
							Ubah kata sandi untuk melindungi akun Anda.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<ChangePasswordForm />
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
