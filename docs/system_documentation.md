# Dokumentasi Sistem English Hive Management

Dokumentasi ini menjelaskan fitur-fitur, alur kerja (flows), dan struktur teknis dari Sistem Manajemen English Hive.

## 1. Tinjauan Sistem & Tech Stack

Sistem ini adalah aplikasi manajemen kursus bahasa Inggris yang menangani operasional harian, mulai dari pendaftaran murid, manajemen kelas, absensi, hingga pembayaran.

### Teknologi Utama
- **Framework**: Next.js (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **API**: tRPC (Type-safe API endpoints)
- **UI Library**: Shadcn UI / Tailwind CSS
- **Authentication**: NextAuth.js (User sessions)

---

## 2. Aktor & Hak Akses (Roles)

Sistem membagi pengguna menjadi tiga peran utama:

1. **MANAGER** (Super Admin)
   - Memiliki akses penuh ke seluruh cabang dan fitur.
   - Bisa melihat dan mengedit data lintas cabang.
   - Bisa menghapus data sensitif (misal: pembayaran).

2. **ADMIN** (Staff Cabang)
   - Fokus pada manajemen operasional satu cabang tertentu.
   - Bisa mengelola murid, kelas, pendaftaran, dan pembayaran di cabangnya.
   - Tidak bisa mengakses data cabang lain (dibatasi oleh middleware dan router logic).

3. **GURU**
   - Akses terbatas pada aktivitas mengajar.
   - Bisa melihat jadwal mengajarnya sendiri.
   - Melakukan absensi murid dan absensi diri sendiri.

---

## 3. Fitur Utama & Alur Kerja

### A. Manajemen Master Data (Cabang & Ruang)
Sebelum operasional berjalan, master data harus disiapkan.
- **Cabang**: Lokasi operasional (misal: Pusat, Cabang A). Setiap cabang memiliki data murid, kelas, dan keuangannya sendiri.
- **Ruang**: Fasilitas fisik di setiap cabang.
- **Jenis Kelas**: Master data level kursus (TinyTods, LittleStar, dll) beserta harga standar dan harga bukunya.
- **Slot Waktu (Jam)**: Slot waktu tetap (Regular) atau Custom (Private).

### B. Manajemen Murid (Student Lifecycle)
Alur hidup data murid dalam sistem:

1. **Registrasi (Calon Murid)**: Admin menginput data calon murid. Status awal biasanya `PENDAFTAR_BARU`.
2. **Placement Test / Trial**: Jika perlu, murid dijadwalkan test atau trial. Status berubah menjadi `PLACEMENT_TEST` atau `TRIAL`.
3. **Pendaftaran Kelas (Enrollment)**:
   - Murid didaftarkan ke Kelas tertentu.
   - **Logika Aktivasi**: Saat status pendaftaran diubah menjadi `AKTIF`, sistem otomatis:
     - Mengubah status Murid menjadi `AKTIF`.
     - **Generate Tagihan SPP**: Menghitung biaya prorata berdasarkan sesi yang tersisa.
     - **Generate Tagihan Buku**: Jika jenis kelas memiliki harga buku, tagihan buku otomatis dibuat.
4. **Resign / Lulus**: Jika murid berhenti, status diubah menjadi `NON_AKTIF` atau `LULUS`. Admin bisa menonaktifkan pendaftaran kelas agar tagihan berhenti berjalan.

### C. Manajemen Kelas & Jadwal
- **Kelas**: Kumpulan rencana belajar. Satu kelas memiliki Level, Guru Pengajar, dan Harga.
- **Jadwal**: Menentukan kapan kelas bertemu (Hari, Jam, Ruang).
- **History Guru**: Sistem mencatat riwayat guru yang mengajar di kelas tersebut. Jika guru diganti, guru lama tercatat sebagai `INACTIVE` di kelas tersebut, dan guru baru menjadi `ACTIVE`.

### D. Absensi (Attendance Flow)
Sistem mencatat kehadiran dua pihak: Murid dan Guru.

1. **Absensi Murid**:
   - Dilakukan oleh Guru atau Admin pada `SesiPertemuanKelas`.
   - Status: `HADIR`, `ALPA`, `SAKIT`, `IZIN`.
   - Absensi ini mempengaruhi laporan perkembangan murid.

2. **Absensi Guru**:
   - Guru melakukan "Check-in" saat mengajar.
   - Admin memverifikasi absensi guru (`isVerified`) untuk keperluan penggajian (payroll).

### E. Keuangan & Pembayaran
Fitur krusial untuk tracking revenue.

1. **Invoicing (Penagihan)**:
   - **Otomatis**: Tagihan SPP otomatis dibuat saat pendaftaran aktif.
   - **Manual**: Admin bisa membuat "Tagihan Lain-lain" (misal: Denda, Biaya Tambahan).
   - **Kategori Tagihan**: Registrasi, Buku, SPP (Pembayaran Kelas), Lainnya.

2. **Pembayaran**:
   - Admin menerima pembayaran tunai/transfer.
   - Admin mengupdate status tagihan menjadi `LUNAS`.
   - **Verifikasi**: Sistem mencatat siapa admin yang memverifikasi pembayaran (`verifiedBy`) dan kapan tanggal bayarnya.
   - **Notifikasi Jatuh Tempo**: Dashboard menampilkan tagihan yang akan jatuh tempo dalam 14 hari ke depan.

### F. Dashboard Analitik
Pusat informasi bagi Admin/Manager.
- **KPI Stats**: Menampilkan jumlah murid aktif, murid baru, waiting list, kelas aktif, dan estimasi tagihan pending (Potential Revenue).
- **Grafik Tren**:
  - Tren Pendaftaran Murid (6 bulan terakhir).
  - Tren Pendapatan (6 bulan terakhir).
- **Jadwal Hari Ini**: Daftar kelas yang harus berjalan hari ini.
- **Sumber Info**: Statistik darimana murid mengetahui English Hive (IG, WA, Teman, dll).

---

## 4. Struktur Database (Schema Overview)

Berikut adalah entitas utama dalam database dan hubungannya:

- **User**: Terhubung ke `Cabang` (Staff) dan `HistoryGuruKelas` (Guru).
- **Murid**: Data profil siswa, terhubung ke `Cabang` dan `PendaftaranKelas`.
- **Kelas**: Entitas pusat akademik.
  - *HasMany* `JadwalKelas` (Waktu & Ruang).
  - *HasMany* `SesiPertemuanKelas` (Realisasi pertemuan fisik).
  - *HasMany* `PendaftaranKelas` (Siapa saja murid di kelas ini).
- **PendaftaranKelas**: Tabel pivot antara Murid dan Kelas. Menyimpan status enrollment (`AKTIF`, `TRIAL`, dll).
  - *HasMany* `Pembayaran` (Tagihan SPP terkait pendaftaran ini).
- **Pembayaran**: Mencatat detil transaksi keuangan.
- **AbsensiMurid**: Pivot antara Murid dan SesiPertemuan.
- **AbsensiGuru**: Pivot antara Guru dan SesiPertemuan.

---

## 5. Security & Validasi
- **Middleware Protection**: Route dilindungi berdasarkan session token yang valid.
- **Role-Based Access Control (RBAC)**:
  - Router API (tRPC) memvalidasi role user sebelum memproses request (misal: hanya Admin yang bisa delete pembayaran).
- **Branch Scoping (Isolasi Cabang)**:
  - User Admin Cabang A tidak bisa melihat atau mengedit data Cabang B. Logic ini diterapkan di level query database (`where: { cabangId: ctx.user.cabangId }`).
