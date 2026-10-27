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

6. **Frontend UI/UX Resilience & Zero-Blocking Architecture:**
   - **Zero Browser Dialogs:** Eliminasi total dialog pemblokir thread peramban (`window.alert()` dan `window.confirm()`) digantikan oleh sistem `ToastProvider` terpusat dan modal asinkronus `ConfirmDialog` berbasis Base UI yang ramah aksesibilitas.
   - **Proteksi In-Flight Action:** Penonaktifan otomatis tombol mutasi (*disabled state*) dan indikator pemuatan (*loading spinner*) selama proses asinkronus berlangsung untuk mencegah transmisi ganda (*double submission*).
   - **Client-Side Pre-Upload RAM Guard:** Pustaka validasi berkas (`src/lib/file-validation.ts`) memeriksa ukuran (< 5MB) dan MIME type di peramban sebelum transmisi jaringan dimulai, menghemat kuota pengguna dan mencegah beban komputasi server sia-sia.
   - **Anti-Hanging Midtrans Payment Flow:** Penanganan komprehensif seluruh callback Snap (`onClose`, `onPending`, `onError`) serta tombol sinkronisasi manual status pembayaran (`/api/payment/verify-status`) jika terjadi gangguan koneksi atau webhook tertunda.
   - **Precision Calendar & Date Masking:** Auto-masking pengetikan manual tanggal (`DD/MM/YYYY`) dengan validasi kalender WIB (UTC+7), tahun kabisat, dan deteksi benturan tanggal reservasi/blokir host secara seketika (*real-time*).
   - **Hierarchical Error Boundaries & Contextual 404:** Struktur penanganan galat bertingkat (`global-error.tsx`, `error.tsx`, dan `properties/[id]/error.tsx`) dengan sanitasi `error.digest` (Incident ID) tanpa kebocoran *stack trace*.
   - **100% Symmetric Localization:** Kamus dwibahasa (ID/EN) terpadu dengan 421 translation keys tanpa risiko nilai `undefined`.

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
| **Styling & Tampilan** | [Tailwind CSS v4](https://tailwindcss.com/) + [Radix / Base UI](https://base-ui.com/) + [Lucide Icons](https://lucide.dev/) + Toast Provider |
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

# Cron Worker Escrow Release
CRON_SECRET="kunci_rahasia_cron_worker_disini"
```

### 4. Sinkronisasi Skema Database & Seeding
Generate Prisma Client, dorong skema relasional, dan isi data awal (*seed*):
```bash
# Sinkronkan skema database
npx prisma db push

# Generate client Prisma terbaru
npx prisma generate

# Isi data awal / demo data (Admin, Hosts terverifikasi, Tamu, dan Akomodasi contoh)
pnpm db:seed
# atau: npx prisma db seed
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
- **Katalog API & Server Actions:** Dokumentasi 30+ Route Handlers RESTful dan fungsi mutasi data.
- **Formula Finansial & Kebijakan Bisnis:** Perhitungan matematis sewa, *cleaning fee*, komisi split-fee, dan aturan pembatalan.

---

## 📁 Struktur Direktori Utama

```text
src/
├── app/                  # Next.js App Router (Halaman, Layout, Error Boundaries, dan API Handlers)
│   ├── actions/          # Server Actions untuk mutasi data profil & preferensi
│   ├── admin/            # Portal Administrator (/admin) dengan subkomponen tab & modal
│   ├── api/              # RESTful API Route Handlers (auth, bookings, host, payment, cron)
│   ├── bookings/         # Halaman E-Voucher resmi (/bookings/[id]/voucher) & tiket cetak
│   ├── checkout/         # Alur pembayaran Midtrans Snap & verifikasi aktif di sisi klien
│   ├── dashboard/        # Dasbor pengguna untuk pemantauan perjalanan & payout host
│   ├── profile/          # Pengaturan profil, privasi UU PDP, kontak darurat, & billing
│   ├── properties/       # Halaman listing, pembuatan kamar (/new), dan detail ([id])
│   │   └── [id]/         # Detail properti + subkomponen tanggal, contextual error & not-found
│   ├── error.tsx         # Root error boundary (penanganan crash aplikasi umum)
│   ├── global-error.tsx  # Root layout fatal error boundary (fallback crash HTML)
│   ├── not-found.tsx     # Halaman 404 global dengan navigasi pemulihan
│   ├── layout.tsx        # Root layout (ThemeProvider, ToastProvider, Navbar, Footer)
│   └── page.tsx          # Homepage marketplace & eksplorasi akomodasi
├── components/           # Komponen UI global
│   ├── bookings/         # Modal pembatalan pesanan & pelaporan sengketa
│   ├── calendar/         # Kalender dwibulan, kalkulator fleksibilitas, guest counter
│   ├── properties/       # Form pendaftaran akomodasi & upload galeri
│   └── ui/               # Primitif desain sistem (ConfirmDialog, Toast, EmptyState, Button, Badge)
├── lib/                  # Logika bisnis inti & utilitas
│   ├── dictionaries/     # Kamus lokalisasi simetris ID & EN (421 keys)
│   ├── date-standards.ts # Standarisasi Operasional WIB (UTC+7)
│   ├── file-validation.ts# Pre-upload client validation (MIME & size guard)
│   ├── settings.ts       # Kalkulator finansial & system settings resolver
│   └── notifications.ts  # Integrasi email transaksional Resend
├── middleware.ts         # Edge Middleware pengamanan rute portal dan API admin
└── types/                # Definisi kontrak tipe TypeScript terpusat
```

---

## 🛡️ Keamanan & Kepatuhan (Defense in Depth)

Sistem menerapkan arsitektur keamanan berlapis yang telah melalui audit menyeluruh:

1. **Kepatuhan Privasi Data UU PDP No. 27/2022:**
   - Sanitasi payload React Server Components (RSC Flight HTML) di `/properties/[id]`, `/dashboard`, dan `/admin` menggunakan Prisma `select` eksplisit.
   - Password hash bcrypt, NIK KTP, URL berkas identitas fisik, dan nomor kontak darurat pribadi terisolasi di sisi server dan tidak pernah bocor ke klien browser.
   - Hak Akses Subjek Data: Fitur ekspor berkas JSON data riwayat akun lengkap via `/api/user/export-data`.

2. **Pengerasan Upload Berkas Berlapis (Defense-in-Depth):**
   - Validasi sisi klien (`src/lib/file-validation.ts`): Menolak berkas non-gambar atau ukuran > 5 MB langsung di peramban sebelum transmisi jaringan dimulai.
   - Validasi ketat sisi server: Memeriksa ulang MIME type (`image/jpeg`, `image/png`, `image/webp`), menolak SVG/HTML/berkas eksekutabel (HTTP 400).
   - Batas ukuran berkas 5 MB dievaluasi *sebelum* alokasi buffer RAM untuk mencegah crash OOM dan serangan Denial of Service (HTTP 413 Payload Too Large).
   - Isolasi folder Cloudinary terpisah untuk `properties`, `avatars`, `kyc`, dan `refunds`.

3. **Timing-Safe Cryptographic Signature & Webhook Idempoten:**
   - Verifikasi notifikasi pembayaran Midtrans dan worker Cron menggunakan `crypto.timingSafeEqual` untuk menutup celah *timing attack*.
   - Pemrosesan idempoten yang menjaga status terminal escrow (`DISPUTED`, `RELEASED`, `CANCELLED`) dari *replay attack*.

4. **Integritas Escrow & Terminal State Locks:**
   - Pembatalan pesanan sepihak diblokir ketat di tingkat server jika booking sedang bersengketa (`DISPUTED`) atau dana telah dirilis (`RELEASED`) (HTTP 400).
   - Resolusi sengketa dibatasi plafon total pesanan (`finalRefundApproved + finalPayoutApproved <= bookingTotal`) dan berstatus terminal (*immutable*).
   - Penolakan payout (`FAILED`) oleh admin otomatis memulihkan penalti host menjadi `isDeducted: false`.

5. **Mass-Assignment Guard & Otorisasi Mutasi:**
   - Pembaruan properti (`PUT /api/properties/[id]`) menggunakan *explicit field whitelist*, mencegah manipulasi atribut terproteksi (`hostId`, `cancellationCount`, `isPublished`, `id`).
   - Validasi rating ulasan murni integer 1–5 dan pencegahan ulasan duplikat per reservasi.
   - Properti dengan reservasi aktif yang belum check-out terlindungi dari penghapusan (`DELETE /api/properties/[id]`).

6. **Pessimistic Locking & Interactive Concurrency:**
   - Penguncian baris database tingkat rendah (`SELECT ... FOR UPDATE`) saat inisiasi pemesanan untuk mencegah *double booking*.
   - Transaksi interaktif serializable pada penarikan dana host (`/api/host/payouts`) untuk mencegah *double withdrawal*.

7. **Fail-Safe Secrets & Cron Security:**
   - Seluruh kredensial (Cloudinary, Midtrans) murni dibaca dari environment variables tanpa fallback string dummy/live key di source code.
   - Endpoint otomatisasi `/api/cron/release-escrow` diwajibkan menyertakan header `Authorization: Bearer ${CRON_SECRET}` (HTTP 401 Unauthorized jika tidak valid).

8. **Sanitasi Error & Proteksi Informasi Internal (Zero Stack Leak):**
   - Error Boundaries App Router (`error.tsx`, `global-error.tsx`, `properties/[id]/error.tsx`) mengisolasi kegagalan komponen tanpa mengekspos *stack trace*, path file internal, atau payload query ke pengguna publik.
   - Hanya menyajikan identifier insiden acak (`error.digest` / Incident ID) yang aman dibagikan pengguna untuk korelasi dengan log server internal.

---

## 📄 Lisensi & Catatan Proyek

Proyek ini merupakan **proyek pribadi (*personal portfolio / showcase project*)** yang dikembangkan oleh **Fadhil Syauqy** untuk tujuan eksplorasi rekayasa perangkat lunak, arsitektur sistem, dan demonstrasi implementasi platform *vacation rental* berskala penuh.

Didistribusikan di bawah lisensi [MIT License](https://opensource.org/licenses/MIT). Terbuka untuk dipelajari, dijadikan referensi, dan dikembangkan lebih lanjut.
