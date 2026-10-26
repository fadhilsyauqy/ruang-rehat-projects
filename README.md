# Ruang Rehat — Platform Marketplace Akomodasi & Vacation Rental

[![Next.js](https://img.shields.io/badge/Next.js-16.3.8-black?style=flat&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.8-blue?style=flat&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v4-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/Prisma-5.22.0-2D3748?style=flat&logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16+-336791?style=flat&logo=postgresql)](https://www.postgresql.org/)
[![Midtrans](https://img.shields.io/badge/Midtrans-Snap%20Payment-002B49?style=flat)](https://midtrans.com/)
[![Resend](https://img.shields.io/badge/Resend-Email%20API-black?style=flat&logo=resend)](https://resend.com/)

**Ruang Rehat** adalah platform marketplace akomodasi dan penyewaan penginapan (*vacation rental*) modern yang dibangun khusus untuk ekosistem pariwisata Indonesia. Platform ini mengadopsi standar finansial Rupiah murni, ketepatan operasional Waktu Indonesia Barat (WIB), perlindungan dana bersama (*escrow guarantee*), serta kepatuhan perlindungan data pribadi sesuai regulasi UU PDP Indonesia.

---

## 🌟 Nilai Unggulan & Pilar Sistem

1. **Standar Finansial Pure Integer IDR:**
   - Seluruh kalkulasi harga sewa, biaya kebersihan, komisi platform, dan penarikan dana tuan rumah diproses dalam satuan **IDR bulat murni** (*zero decimal floating issues*).
   - Kurs acuan dinamis terintegrasi (`1 USD = 18.051 IDR`) untuk mendukung listing warisan (*legacy listings*) tanpa merusak integritas transaksi.

2. **Standar Operasional Indonesia (WIB / UTC+7):**
   - Jam operasional seragam di seluruh listing: **Check-in Pukul 14:00 WIB** dan **Check-out Pukul 12:00 WIB**, dengan *cleaning buffer* 2 jam di antara masa sewa.
   - Periode garansi komplain tamu berlaku presisi selama **24 jam** sejak jadwal check-in resmi tiba (H+1 14:00 WIB).

3. **Integritas Transaksi & Anti-Double Booking:**
   - Menerapkan penguncian baris database tingkat rendah (*Pessimistic Row-Level Locking* `SELECT ... FOR UPDATE`) saat inisiasi pemesanan.
   - Sesi pembayaran terproteksi dengan batas kedaluwarsa (*time-to-live*) **60 menit**, mencegah slot tanggal terkunci selamanya jika pembayaran tidak diselesaikan.

4. **Perlindungan Dana Bersama (Escrow & Dispute Resolution):**
   - Dana sewa tamu ditahan secara aman di rekening *escrow* platform dan baru otomatis dirilis ke saldo Tuan Rumah setelah melewati jendela garansi sengketa 24 jam tanpa keluhan.
   - Mekanisme mediasi sengketa berjenjang yang memungkinkan Administrator memutuskan *Full Refund*, *Partial Refund*, atau pelepasan dana ke Host.

5. **Kepatuhan Regulasi & Privasi (UU PDP & Faktur Korporat):**
   - Tamu dapat mengekspor data pribadi akun dalam format JSON terstruktur (Hak Akses Subjek Data UU PDP).
   - Tersedia opsi penambahan data NPWP perusahaan dan nama entitas bisnis pada e-voucher resmi untuk keperluan *reimbursement* perjalanan dinas.

---

## 🚀 Fitur Berdasarkan Peran Pengguna

### 🏖️ Tamu (Guest)
- **Pencarian Cerdas & Peta Interaktif:** Eksplorasi listing berdasarkan wilayah, rentang tanggal fleksibel, jumlah tamu, dan area pandang peta Leaflet (*bounding box*).
- **Pembayaran Multichannel Midtrans Snap:** Pembayaran instan via QRIS (GoPay, ShopeePay), Transfer Virtual Account (BCA, Mandiri, BNI, BRI), dan Kartu Kredit/Debit.
- **E-Voucher Digital Resmi:** Tiket reservasi lengkap dengan QR Code, detail kontak darurat, ringkasan penagihan, dan instruksi check-in.
- **Pembatalan Transparan:** Kalkulasi hak pengembalian dana (*refund*) otomatis berdasarkan matriks kebijakan pembatalan properti (*Flexible*, *Moderate*, *Strict*).
- **Pusat Keluhan (Dispute Portal):** Pengajuan komplain disertai unggahan bukti foto jika fasilitas tidak sesuai atau akomodasi bermasalah.

### 🏡 Tuan Rumah (Host)
- **Manajemen Properti Bertahap:** Alur pendaftaran akomodasi dengan fasilitas lengkap, titik koordinat peta, dan galeri foto via Cloudinary.
- **Perlindungan Konsumen (KYC Gating):** Listing baru otomatis berstatus *DRAFT* hingga dokumen identitas KTP pemilik diverifikasi oleh Admin.
- **Kalender Ketersediaan & Pemblokiran:** Kontrol ketersediaan kamar manual serta sistem blokir permanen otomatis jika Host melakukan pembatalan sepihak.
- **Penarikan Dana (Payout Portal):** Manajemen rekening bank, pemantauan saldo tertahan vs saldo siap tarik, dan riwayat penarikan transparan.

### 🛡️ Administrator (Admin)
- **Dasbor Eksekutif Terpadu:** Pemantauan metrik pendapatan, volume reservasi aktif, dan status sirkulasi dana escrow.
- **Audit Verifikasi KYC:** Verifikasi dokumen KTP mitra tuan rumah dengan pratinjau resolusi tinggi dan formulir penolakan berargumen jelas.
- **Approval Payout Semi-Manual:** Persetujuan pencairan dana host dengan validasi nomor referensi transfer bank resmi dan kunci status terminal (*Terminal State Lock*).
- **Resolusi Sengketa & Refund Manual:** Keputusan pengembalian dana tamu (VA/QRIS) disertai unggahan bukti transfer pengembalian dana.
- **Ekspor Pemasaran (Marketing Subscribers):** Unduh daftar tamu yang memilih menerima email promosi (*opt-in*) ke dalam berkas CSV UTF-8 BOM siap pakai.
- **Simulator Kebijakan Sistem:** Pengaturan dinamis persentase komisi platform, batas durasi menginap, dan kurs mata uang tanpa *downtime*.

---

## 🛠️ Tech Stack & Arsitektur

| Lapisan | Pustaka & Layanan |
| :--- | :--- |
| **Framework Utama** | [Next.js 16 (App Router)](https://nextjs.org/) + [React 19](https://react.dev/) |
| **Bahasa Pemrograman** | [TypeScript (Strict Mode)](https://www.typescriptlang.org/) |
| **Styling & Tampilan** | [Tailwind CSS v4](https://tailwindcss.com/) + [Radix / Base UI](https://base-ui.com/) + [Lucide Icons](https://lucide.dev/) |
| **Basis Data & ORM** | [PostgreSQL](https://www.postgresql.org/) + [Prisma ORM 5.22](https://www.prisma.io/) |
| **Autentikasi & RBAC** | [NextAuth.js v5 (Auth.js Beta)](https://authjs.dev/) + Bcrypt.js |
| **Payment Gateway** | [Midtrans Snap API](https://midtrans.com/) (Sandbox & Production) |
| **Layanan Media & Cloud** | [Cloudinary SDK](https://cloudinary.com/) (Penyimpanan gambar akomodasi & KTP) |
| **Email Transaksional** | [Resend](https://resend.com/) (Konfirmasi e-voucher, notifikasi pesanan, bukti payout) |
| **Peta Interaktif** | [Leaflet](https://leafletjs.com/) & [React-Leaflet](https://react-leaflet.js.org/) |

---

## ⚡ Panduan Instalasi Lokal (Quick Start)

Ikuti langkah-langkah di bawah ini untuk menjalankan Ruang Rehat di lingkungan pengembangan (*local development*):

### 1. Prasyarat Sistem
- **Node.js:** Versi `20.x` atau lebih baru
- **Package Manager:** `pnpm` (disarankan v10/12) atau `npm`
- **Database:** Server PostgreSQL aktif (lokal atau cloud seperti Supabase / Neon)

### 2. Klon Repositori & Instal Dependensi
```bash
git clone https://github.com/fadhilsyauqy/airbnb-projects.git
cd airbnb-projects

# Instal seluruh dependensi proyek
pnpm install
# atau jika menggunakan npm:
npm install
```

### 3. Konfigurasi Variabel Lingkungan
Salin berkas template lingkungan dan lengkapi nilainya:
```bash
cp .env.example .env
```

Pastikan variabel-variabel kunci berikut terisi di dalam `.env`:
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/ruangrehat?schema=public"

# NextAuth v5
AUTH_SECRET="buat_kunci_acak_32_karakter_disini"
NEXTAUTH_URL="http://localhost:3000"

# Midtrans Payment Gateway
MIDTRANS_SERVER_KEY="SB-Mid-server-xxxx"
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY="SB-Mid-client-xxxx"

# Cloudinary
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"

# Resend Email API
RESEND_API_KEY="re_xxxx"
EMAIL_FROM="Ruang Rehat <onboarding@resend.dev>"
```

### 4. Sinkronisasi Skema Database
Generate Prisma Client dan dorong skema relasional ke database Anda:
```bash
# Sinkronkan skema database
npx prisma db push

# Generate client Prisma terbaru
npx prisma generate
```

### 5. Jalankan Server Pengembangan
```bash
pnpm dev
# atau:
npm run dev
```

Buka peramban (*browser*) Anda di alamat:
👉 **[http://localhost:3000](http://localhost:3000)**

---

## 📖 Dokumentasi Arsitektur Mendalam

Untuk mempelajari cetak biru arsitektur sistem secara menyeluruh, silakan baca berkas **[ARCHITECTURE.md](./ARCHITECTURE.md)** yang memuat:

- **Entity Relationship Diagram (ERD):** Visualisasi relasi seluruh tabel database Prisma menggunakan sintaks Mermaid.
- **State Machine Diagrams:** Transisi status siklus hidup reservasi, pembayaran, dana escrow, payout host, dan audit KYC.
- **Sequence Diagrams:** Alur interaksi Frontend $\rightarrow$ Route Handlers $\rightarrow$ PostgreSQL $\rightarrow$ Midtrans / Resend.
- **Matriks Hak Akses (RBAC):** Tabel granular izin fitur untuk Guest, Host Unverified, Host Verified, dan Administrator.
- **Katalog API & Server Actions:** Dokumentasi 29 Route Handlers RESTful dan fungsi mutasi data.
- **Formula Finansial & Kebijakan Bisnis:** Perhitungan matematis sewa, *cleaning fee*, komisi split-fee, dan aturan pembatalan.

---

## 📁 Struktur Direktori Utama

```text
src/
├── app/                  # Next.js App Router (Halaman, Layout, dan API Handlers)
│   ├── actions/          # Server Actions untuk mutasi data profil & preferensi
│   ├── admin/            # Portal Administrator (/admin) dengan subkomponen tab & modal
│   ├── api/              # RESTful API Route Handlers (auth, bookings, host, payment, cron)
│   ├── checkout/         # Alur pembayaran Midtrans Snap di sisi klien
│   ├── dashboard/        # Dasbor pengguna untuk pemantauan perjalanan & payout host
│   ├── profile/          # Pengaturan profil, privasi UU PDP, kontak darurat, & billing
│   └── properties/       # Halaman listing, pembuatan kamar baru (/new), dan edit
├── components/           # Komponen UI global (Calendar dwibulan, Dialog, Badge status)
├── lib/                  # Logika bisnis inti (settings.ts, date-standards.ts, notifications.ts)
├── middleware.ts         # Edge Middleware pengamanan rute portal dan API admin
└── types/                # Definisi kontrak tipe TypeScript terpusat
```

---

## 🛡️ Keamanan & Kepatuhan

- **Data Protection:** Seluruh kata sandi dienkripsi menggunakan algoritma `bcryptjs` dengan *salt rounds* standar industri.
- **Pessimistic Locking:** Mencegah kondisi balapan (*race condition*) dan pemesanan ganda pada kamar akomodasi.
- **Audit Trail Payout:** Seluruh pencairan dana host berstatus `COMPLETED` dan `FAILED` dilindungi oleh *Terminal State Lock* (tidak dapat diubah atau ditolak ganda).
- **Perlindungan Webhook:** Validasi tanda tangan digital SHA-512 pada notifikasi gateway pembayaran Midtrans untuk menangkal manipulasi parameter request.

---

## 📄 Lisensi & Catatan Proyek

Proyek ini merupakan **proyek pribadi (*personal portfolio / showcase project*)** yang dikembangkan oleh **Fadhil Syauqy** untuk tujuan eksplorasi rekayasa perangkat lunak, arsitektur sistem, dan demonstrasi implementasi platform *vacation rental* berskala penuh.

Didistribusikan di bawah lisensi [MIT License](https://opensource.org/licenses/MIT). Terbuka untuk dipelajari, dijadikan referensi, dan dikembangkan lebih lanjut.
