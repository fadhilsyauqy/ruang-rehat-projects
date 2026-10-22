# Dokumentasi Sistem: Peran, Fitur, dan Pengaturan Akun
**Aplikasi Ruang Rehat (Modern Airbnb Architecture)**

Dokumen ini menyajikan rincian menyeluruh mengenai arsitektur hak akses peran (*roles*), katalog fitur aplikasi beserta fungsinya, aturan otomatisasi siklus transaksi (*business rules*), serta spesifikasi pengaturan yang dapat dikonfigurasi oleh pengguna berdasarkan perannya.

---

## Daftar Isi
1. [Ringkasan Peran Pengguna (Roles)](#1-ringkasan-peran-pengguna-roles)
2. [Matriks Hak Akses & Kapabilitas Peran](#2-matriks-hak-akses--kapabilitas-peran)
3. [Katalog Fitur Aplikasi & Kegunaannya](#3-katalog-fitur-aplikasi--kegunaannya)
4. [Aturan Otomatisasi Siklus Transaksi (Business Rules)](#4-aturan-otomatisasi-siklus-transaksi-business-rules)
5. [Rincian Pengaturan Akun per Role (/profile)](#5-rincian-pengaturan-akun-per-role-profile)
   - [A. Pengaturan Universal (Tamu, Tuan Rumah, & Admin)](#a-pengaturan-universal-tamu-tuan-rumah--admin)
   - [B. Pengaturan Khusus Role GUEST (Tamu)](#b-pengaturan-khusus-role-guest-tamu)
   - [C. Pengaturan Khusus Role HOST (Tuan Rumah)](#c-pengaturan-khusus-role-host-tuan-rumah)
   - [D. Pengaturan & Wewenang Role ADMIN (Pengelola Platform)](#d-pengaturan--wewenang-role-admin-pengelola-platform)
6. [Penyelarasan Fitur Komunikasi (Tamu & Tuan Rumah)](#6-penyelarasan-fitur-komunikasi-tamu--tuan-rumah)
7. [Skema Entitas Basis Data Terkait (Prisma Schema)](#7-skema-entitas-basis-data-terkait-prisma-schema)

---

## 1. Ringkasan Peran Pengguna (Roles)

Sistem mengadopsi 3 tingkat peran utama yang dikelola melalui enum `Role` pada basis data PostgreSQL:

```prisma
enum Role {
  GUEST
  HOST
  ADMIN
}
```

### 1. `GUEST` (Tamu / Pengguna Standar)
* **Status**: Peran bawaan (*default*) untuk seluruh pengguna baru yang mendaftar melalui kredensial email/kata sandi maupun OAuth (Google/GitHub).
* **Fokus Utama**: Menjelajahi akomodasi, menyimpan wishlist, melakukan pemesanan (*booking*), membayar reservasi dengan aman, mengakses tiket digital / e-voucher, serta memberikan ulasan pasca-menginap.

### 2. `HOST` (Tuan Rumah / Pengelola Properti)
* **Status**: Peran lanjutan bagi mitra pemilik kamar, rumah, atau villa.
* **Mekanisme Promosi Otomatis**: Seorang pengguna dengan peran `GUEST` akan secara otomatis dipromosikan menjadi `HOST` begitu mereka berhasil mempublikasikan listing properti pertamanya melalui rute `/properties/new` (`prisma.user.update({ where: { id }, data: { role: 'HOST' } })`).
* **Fokus Utama**: Mengelola daftar listing properti, mengatur ketersediaan tanggal kalender sewa, memantau reservasi masuk, serta mengonfigurasi rekening pencairan dana sewa via BI-FAST.

### 3. `ADMIN` (Pengawas / Pengelola Platform)
* **Status**: Peran pengawas operasional pasar (*marketplace governor & auditor*).
* **Fokus Utama**: Memverifikasi identitas pengguna/KTP (KYC), menyetujui atau menolak permohonan penarikan dana sewa (*payout approvals*), menengahi sengketa pembatalan/refund (*dispute resolution*), dan memoderasi kelayakan listing penginapan.

---

## 2. Matriks Hak Akses & Kapabilitas Peran

| Kemampuan / Fitur | Tamu (`GUEST`) | Tuan Rumah (`HOST`) | Admin (`ADMIN`) | Keterangan & Rute |
| :--- | :---: | :---: | :---: | :--- |
| **Pencarian & Filter Penginapan** | ✅ | ✅ | ✅ | Beranda (`/`) dengan live filter & peta |
| **Menyimpan Properti ke Wishlist** | ✅ | ✅ | ✅ | Koleksi favorit pribadi (`/wishlists`) |
| **Membuat Reservasi (*Booking*)** | ✅ | ✅ | ✅ | Halaman detail unit (`/properties/[id]`) |
| **Pembayaran Midtrans (VA/QRIS/CC)** | ✅ | ✅ | ✅ | Checkout terintegrasi (`/checkout/[id]`) |
| **Akses E-Voucher Digital + QR Code** | ✅ | ✅ | ✅ | Boarding pass resmi (`/bookings/[id]/voucher`) |
| **Memberi Ulasan & Rating** | ✅ | ✅ | ✅ | Formulir ulasan pasca-booking selesai |
| **Pengaturan Profil & Keamanan** | ✅ | ✅ | ✅ | Akun terpadu 2-kolom (`/profile`) |
| **Preferensi Bahasa, Mata Uang, Tema** | ✅ | ✅ | ✅ | Dwibahasa ID/EN, IDR/USD, Light/Dark/System |
| **Mendaftarkan Penginapan Baru** | ✅ *(Auto-upgrade)* | ✅ | ❌ | Rute pembuatan listing (`/properties/new`) |
| **Dashboard Operasional Properti** | ❌ | ✅ | ❌ | Tab *Properties* (`/dashboard?tab=properties`) |
| **Manajemen Reservasi Masuk** | ❌ | ✅ | ❌ | Tab *Bookings* (`/dashboard?tab=bookings`) |
| **Blokir & Buka Tanggal Kalender** | ❌ | ✅ | ❌ | Tab *Availability* (`/dashboard?tab=availability`) |
| **Daftar Rekening Bank BI-FAST** | ❌ | ✅ | ❌ | Tab *Payouts* (`/dashboard?tab=payouts`) |
| **Tarik Saldo Sewa (*Request Payout*)**| ❌ | ✅ | ❌ | Penarikan dana dari saldo berstatus `RELEASED` |
| **Persetujuan Pencairan Dana (*Approve Payout*)** | ❌ | ❌ | ✅ | Panel persetujuan transfer bank (`/admin/payouts`) |
| **Verifikasi Dokumen Identitas / KYC** | ❌ | ❌ | ✅ | Panel audit KTP/Paspor (`/admin/users/kyc`) |
| **Resolusi Sengketa & Refund Escrow** | ❌ | ❌ | ✅ | Penengah komplain dana tertahan (`/admin/disputes`) |
| **Moderasi & Suspend Listing Properti** | ❌ | ❌ | ✅ | Pengawasan kepatuhan unit sewa (`/admin/properties`) |

---

## 3. Katalog Fitur Aplikasi & Kegunaannya

### 1. Pencarian Pintar & Filter Multi-Kriteria
* **Rute**: `/` (Beranda)
* **Kegunaan**: Memudahkan calon penyewa menemukan hunian sesuai kriteria perjalanan mereka:
  * Pencarian lokasi/kota tujuan berbasis teks.
  * Pemilih rentang tanggal *check-in* dan *check-out*.
  * Filter kapasitas jumlah tamu (dewasa, anak).
  * Filter kategori visual (`BEACH`, `VILLA`, `ICONIC`, `URBAN`, dsb.).
  * Slider rentang harga interaktif (*dynamic price range*).
  * Filter fasilitas (*Wi-Fi, Kolam Renang, Dapur, AC, Parkir Gratis, dll.*).

### 2. Peta Interaktif Spasial
* **Rute**: `/` & `/properties/[id]`
* **Kegunaan**: Memberikan representasi geografis lokasi properti secara akurat. Tamu dapat melihat titik koordinat properti, harga per malam langsung di pin peta, serta lingkungan di sekitar properti.

### 3. Detail Properti & Galeri Visual
* **Rute**: `/properties/[id]`
* **Kegunaan**: Menyajikan transparansi informasi lengkap sebelum memesan:
  * Galeri foto multi-sudut resolusi tinggi.
  * Deskripsi fasilitas, peraturan menginap, kebijakan pembatalan, dan kapasitas ruangan.
  * Kartu profil dan badge verifikasi identitas tuan rumah.
  * Ulasan dan rating historis dari tamu terverifikasi sebelumnya.

### 4. Kalkulator Tarif & Sistem Validasi Anti-Bentrok
* **Rute**: `/properties/[id]` & `/api/bookings`
* **Kegunaan**:
  * Menghitung rincian biaya menginap dinamis (tarif dasar malam × durasi hari + biaya kebersihan + biaya layanan platform).
  * Mengunci (*disabled*) tanggal kalender yang sudah dipesan tamu lain atau telah diblokir secara manual oleh host, mencegah terjadinya bentrok reservasi ganda (*double booking*).

### 5. Midtrans Payment Gateway & Rekening Bersama (*Escrow*)
* **Rute**: `/checkout/[id]`, `/api/payment`, `/api/webhooks/midtrans`
* **Kegunaan**:
  * Memproses transaksi aman berstandar bank melalui Virtual Account (BCA, Mandiri, BRI, BNI), QRIS (GoPay, ShopeePay), dan Kartu Kredit.
  * Webhook otomatis memperbarui status pesanan dari `PENDING` ke `CONFIRMED` saat dana diterima.
  * Menampung dana sewa dalam status Rekening Bersama / Escrow (`HELD`) sebelum dirilis (`RELEASED`) ke saldo host demi perlindungan transaksi kedua belah pihak.

### 6. E-Voucher Digital & Boarding Pass Resmi
* **Rute**: `/bookings/[id]/voucher`
* **Kegunaan**: 
  * Dokumen resmi bukti konfirmasi pemesanan bergaya *boarding pass*.
  * Dilengkapi **QR Code unik** untuk validasi identitas instan saat proses *check-in* di lokasi.
  * Memuat nomor telepon host, alamat lengkap, petunjuk arah, dan tombol cetak/simpan sebagai PDF.

### 7. Wishlists (Koleksi Favorit)
* **Rute**: `/wishlists` & `/api/favorites`
* **Kegunaan**: Memungkinkan pengguna menandai properti favorit cukup dengan mengetuk ikon hati, mengelompokkannya ke dalam satu layar tanpa perlu melakukan pencarian ulang.

### 8. Sistem Ulasan & Rating Komunitas
* **Rute**: `/api/reviews`
* **Kegunaan**: Mekanisme transparansi di mana tamu yang telah menginap pada pesanan berstatus `COMPLETED` dapat memberikan rating bintang (1 s/d 5) dan komentar pengalaman tinggal. Rating ini diakumulasikan ke skor rata-rata properti.

### 9. Dashboard Pusat Operasional (*Dashboard Hub*)
* **Rute**: `/dashboard`
* **Kegunaan**:
  * **Bagi Tamu**: Membuka tab *Perjalanan Saya (My Stays)* untuk melihat daftar pesanan aktif, jadwal perjalanan mendatang, dan riwayat pesanan lampau.
  * **Bagi Tuan Rumah**: Pusat kendali terintegrasi yang mencakup daftar unit properti (*Properties*), reservasi masuk dari tamu (*Bookings*), kalender ketersediaan (*Availability*), dan laporan keuangan sewa (*Payouts*).

### 10. Manajemen Kalender & Tanggal Terblokir (*Blocked Dates*)
* **Rute**: `/dashboard?tab=availability` & `/api/properties/blocked-dates`
* **Kegunaan**: Memberikan kendali penuh kepada tuan rumah untuk menutup sementara pemesanan di tanggal-tanggal tertentu (misal: saat unit sedang direnovasi atau digunakan keluarga pribadi) disertai catatan alasan penutupan.

### 11. Manajemen Rekening Bank BI-FAST & Payouts
* **Rute**: `/dashboard?tab=payouts`, `/api/host/bank-account`, `/api/host/payouts`
* **Kegunaan**:
  * Host dapat mendaftarkan nomor rekening bank penerima pencairan dana sewa dengan simulasi validasi nama pemilik rekening (*Account Inquiry*).
  * Menampilkan transparansi saldo tertahan di penampungan aman (*Escrow Balance*) versus saldo sewa yang sudah dapat dicairkan (*Available Balance*).
  * Mengajukan penarikan dana sewa (*Payout Request*) langsung ke rekening bank terdaftar.

### 12. Sistem Multi-Bahasa, Multi-Mata Uang & Tema
* **Rute**: Global (Server Actions & Cookies)
* **Kegunaan**:
  * Mendukung **Bahasa Indonesia (ID)** dan **English (EN)** secara menyeluruh di seluruh antarmuka.
  * Mengonversi harga unit secara otomatis antara **IDR (Rp)** dan **USD ($)**.
  * Menyediakan tema visual **Terang (Light)**, **Gelap (Dark)**, dan **Sistem (System)**.

---

## 4. Aturan Otomatisasi Siklus Transaksi (Business Rules)

Berikut adalah panduan logika bisnis sistem yang mengendalikan alur siklus pemesanan, penguncian kalender, rekening bersama, dan pengembalian dana:

### A. Kedaluwarsa Pemesanan (*Booking Hold & Expiry*)
1. **Penguncian Sementara**: Saat tamu membuat pesanan (`BookingStatus: PENDING`), tanggal kalender unit langsung dikunci sementara agar tidak dipesan pengguna lain, dan sistem menetapkan atribut batas waktu `expiresAt = now() + 60 menit`.
2. **Kedaluwarsa Otomatis**: Jika hingga batas `expiresAt` pembayaran belum diselesaikan, atau webhook Midtrans mengirimkan notifikasi `expire`/`cancel`, sistem otomatis:
   * Mengubah `BookingStatus` menjadi `CANCELLED`.
   * Mengubah `PaymentStatus` menjadi `EXPIRED`.
   * Melepaskan kuncian tanggal kalender sehingga tanggal tersebut dapat dipesan kembali oleh pengguna lain.

### B. Siklus Dana Rekening Bersama (*Escrow Lifecycle*)
1. **Dana Ditahan (`HELD`)**: Ketika pembayaran terkonfirmasi lunas oleh Midtrans (`PaymentStatus: PAID`), status pesanan berubah menjadi `CONFIRMED` dan nominal transaksi masuk ke rekening penampungan aman platform dengan status `EscrowStatus: HELD`. Dana ini **belum** dapat ditarik oleh Host.
2. **Pelepasan Dana (`RELEASED`)**: Dana transaksi berpindah dari *Escrow Balance* ke saldo aktif yang siap dicairkan (*Available Balance*) dengan status `EscrowStatus: RELEASED` secara otomatis **24 jam setelah waktu check-in (`startDate`)**, dengan syarat tidak ada laporan sengketa aktif (`DISPUTED`) dari pihak tamu.
3. **Pencairan Dana (*Host Payout*)**:
   * Host hanya dapat mengajukan permohonan pencairan dana (`Payout`) maksimal sebesar total nominal yang telah berstatus `RELEASED` dikurangi akumulasi payout yang sedang berstatus `PENDING`, `PROCESSING`, atau `COMPLETED`.
   * Pengajuan payout akan masuk ke antrean verifikasi Admin sebelum ditransfer melalui jaringan perbankan BI-FAST.

### C. Kebijakan Pembatalan & Pengembalian Dana (*Cancellation & Refund Policies*)
Setiap properti memiliki salah satu dari tiga opsi kebijakan pembatalan:
* **`FLEXIBLE`**:
  * Pembatalan dilakukan hingga **24 jam sebelum waktu check-in** mendapatkan pengembalian dana penuh **100%**.
  * Pembatalan kurang dari 24 jam sebelum check-in: malam pertama tidak dikembalikan, sisa malam dikembalikan 50%.
* **`MODERATE`**:
  * Pembatalan dilakukan hingga **5 hari sebelum waktu check-in** mendapatkan pengembalian dana penuh **100%**.
  * Pembatalan kurang dari 5 hari sebelum check-in: pengembalian dana sebesar 50% dari total tarif malam.
* **`STRICT`**:
  * Pembatalan dilakukan hingga **7 hari sebelum waktu check-in** mendapatkan pengembalian dana sebesar **50%**.
  * Pembatalan kurang dari 7 hari sebelum check-in: tidak berhak atas pengembalian dana sewa (*non-refundable*).

*Catatan Eksekusi Refund*: Saat pengajuan pembatalan memenuhi syarat refund, sistem memperbarui `EscrowStatus` menjadi `REFUNDED_TO_GUEST` dan `PaymentStatus` menjadi `REFUNDED`.

---

## 5. Rincian Pengaturan Akun per Role (`/profile`)

Halaman pengaturan akun (`/profile`) mengadopsi arsitektur 2-kolom modular:
* **Kolom Kiri**: Bilah navigasi vertikal (*Floating Sticky Sidebar*) dengan pintasan kartu hub kontekstual di bagian bawah.
* **Kolom Kanan**: Baris pengaturan interaktif (*Modular Tiles*) dengan fitur edit *inline* (buka/tutup form tanpa pindah halaman).

```
+-----------------------------------------------------------------------------------+
|  Topbar: Breadcrumbs / Pengaturan Akun                       [ Selesai / Done ]   |
+-----------------------------------------------------------------------------------+
|  Hero Banner: Avatar + Ring Glow | Identitas Terverifikasi | Metrik Cepat Role    |
+-----------------------------------------+-----------------------------------------+
|  SIDEBAR NAVIGASI KIRI                  |  KONTEN PENGATURAN KANAN                |
|  - Informasi pribadi                    |  [ Tile 1: Nama Resmi       - (Edit) ]  |
|  - Log masuk & keamanan                 |  [ Tile 2: Foto Profil      - (Edit) ]  |
|  - Privasi & data (Kontekstual)         |  [ Tile 3: Nama Panggilan   - (Edit) ]  |
|  - Notifikasi (Kontekstual)             |  [ Tile 4: Alamat Email     - (Kunci)]  |
|  - Pembayaran (Kontekstual)             |  [ Tile 5: Nomor Telepon    - (Edit) ]  |
|  - Bahasa & Terjemahan                  |  [ Tile 6: Verifikasi KTP   - (Aman) ]  |
|  - Hosting / Peluang Host               |  [ Tile 7: Alamat Domisili  - (Tambah)] |
|                                         |  [ Tile 8: Kontak Darurat   - (Tambah)] |
|  [ Mini Card: Pusat Tamu / Host Hub ]   |                                         |
+-----------------------------------------+-----------------------------------------+
```

---

### A. Pengaturan Universal (Tamu, Tuan Rumah, & Admin)

Pengaturan ini dapat diakses dan dikonfigurasi oleh seluruh pengguna terdaftar:

#### 1. Tab Informasi Pribadi (*Personal Info*)
* **Nama Resmi (*Legal Name*)**: Mengubah nama lengkap yang tertera pada dokumen resmi identitas (KTP/Paspor).
* **Foto Profil (*Avatar*)**: Mengunggah file foto dari disk lokal komputer atau menyematkan URL gambar eksternal.
* **Nama Depan Pilihan (*Preferred Name*)**: Menentukan nama panggilan ramah yang muncul di halaman profil, ulasan, dan e-voucher reservasi.
* **Alamat Email**: Menampilkan alamat email yang terverifikasi (digunakan untuk otentikasi login serta pengiriman bukti bayar & e-voucher).
* **Nomor Telepon**: Menginput nomor telepon seluler aktif untuk koordinasi check-in serta kontak darurat.
* **Verifikasi Dokumen Identitas (*KYC Status*)**: Menampilkan status verifikasi identitas resmi (`UNVERIFIED`, `PENDING`, `VERIFIED`, `REJECTED`) dengan badge proteksi akun.
* **Alamat Domisili**: Menyimpan rincian alamat tempat tinggal resmi pengguna.
* **Kontak Darurat**: Menyimpan nama, nomor telepon, dan hubungan kerabat untuk situasi darurat selama perjalanan.

#### 2. Tab Log Masuk & Keamanan (*Login & Security*)
* **Pembaruan Kata Sandi**:
  * Input kata sandi saat ini (*Current Password*).
  * Input kata sandi baru (minimal 6 karakter) dilengkapi tombol intip sandi (*Show/Hide Password*).
  * Konfirmasi kata sandi baru (*Confirm Password*).
* **Tips Keamanan Akun**: Informasi panduan perlindungan akun dan kerahasiaan kredensial.
* **Riwayat Akun**: Informasi tanggal bergabung dan status akun aktif.

#### 3. Tab Bahasa, Mata Uang & Tema (*Global Preferences*)
* **Bahasa Pilihan (*Language*)**: Memilih antara **Bahasa Indonesia (ID)** atau **English (US)** (disimpan via cookie `/`).
* **Mata Uang (*Currency*)**: Memilih antara **IDR (Rupiah)** atau **USD (US Dollar)** dengan kalkulasi kurs otomatis di katalog dan tagihan.
* **Tema Tampilan (*Theme*)**: Memilih antara **Tema Terang (*Light*)**, **Tema Gelap (*Dark*)**, atau **Otomatis Sistem (*System*)**.

---

### B. Pengaturan Khusus Role `GUEST` (Tamu)

1. **Privasi & Data Tamu (*Privacy & Sharing*)**:
   * **Visibilitas Profil**: Menjelaskan batasan bahwa foto profil dan nama depan tamu hanya ditampilkan kepada tuan rumah ketika pesanan telah terkonfirmasi lunas.
   * **Riwayat Ulasan Tamu**: Menampilkan ringkasan total ulasan menginap yang pernah ditulis oleh tamu di berbagai penginapan.
2. **Notifikasi Tamu (*Notifications*)**:
   * **Pemberitahuan Email**: Pengaturan penerimaan tiket e-voucher digital, invoice tagihan pelunasan, dan panduan check-in ke email tamu.
   * **Pengingat Jadwal Menginap**: Pengaturan pengingat otomatis H-1 sebelum waktu check-in tiba lengkap dengan petunjuk rute dan kontak nomor host.
3. **Pembayaran & Transaksi Tamu (*Payments & Receipts*)**:
   * **Bukti Sewa & E-Voucher**: Akses cepat menuju seluruh tiket reservasi aktif dan arsip riwayat perjalanan di tab `/dashboard?tab=trips`.
   * **Keamanan Transaksi**: Informasi perlindungan pembayaran berenkripsi perbankan via Midtrans (BCA/Mandiri/BRI VA, QRIS, & Kartu Kredit).
   * **Kebijakan Refund**: Panduan ketentuan pembatalan dan mekanisme pengembalian dana sewa ke rekening asal tamu.
4. **Peluang Menjadi Tuan Rumah (*Host Opportunity*)**:
   * Akses ke modul inspiratif *Become a Host* yang memaparkan keuntungan membuka sewa properti, perlindungan tuan rumah, serta tombol pendaftaran langsung ke `/properties/new`.

---

### C. Pengaturan Khusus Role `HOST` (Tuan Rumah)

1. **Privasi & Reputasi Host (*Privacy & Ratings*)**:
   * **Profil Publik Tuan Rumah**: Mengatur tampilan publik kartu identitas tuan rumah, badge *Verified Host*, dan daftar listing properti yang dipublikasikan.
   * **Ulasan & Reputasi**: Menampilkan akumulasi penilaian bintang dan komentar ulasan yang diterima dari para tamu penyewa.
2. **Notifikasi Operasional Host (*Notifications*)**:
   * **Notifikasi Reservasi Masuk**: Notifikasi instan saat ada tamu baru yang melakukan pemesanan dan pelunasan sewa kamar.
   * **Pengingat Kedatangan Tamu**: Notifikasi pada hari-H kedatangan tamu lengkap dengan rincian identitas dan kontak tamu.
   * **Notifikasi Transfer Dana**: Notifikasi saat proses penarikan saldo sewa (*payout*) berhasil diproses ke rekening bank host.
3. **Pencairan Dana & Rekening Bank (*Payouts & Bank Accounts*)**:
   * **Konfigurasi Rekening Bank**: Pengaturan nomor rekening bank tujuan pencairan BI-FAST (Bank BCA, Mandiri, BRI, BNI, CIMB Niaga, dll.) beserta verifikasi nama pemilik rekening.
   * **Riwayat & Saldo Escrow**: Memantau saldo yang masih tertahan di rekening bersama (*Escrow*) dan mengajukan pencairan dana sewa ke rekening bank.
4. **Pusat Alat Tuan Rumah Profesional (*Professional Hosting Tools*)**:
   * Pintasan langsung ke dashboard operasional utama (`/dashboard`).
   * Akses cepat ke penambahan unit properti baru (`/properties/new`).
   * Akses ke kalender penutupan/pembukaan tanggal sewa (*Availability Calendar*).

---

### D. Pengaturan & Wewenang Role `ADMIN` (Pengelola Platform)

Pengguna dengan peran `ADMIN` memiliki halaman kendali khusus (`/admin`) untuk mengelola integritas platform:
1. **Verifikasi Identitas (*KYC Review*)**: Menyetujui atau menolak dokumen KTP/Paspor yang diunggah pengguna untuk mengaktifkan lencana terverifikasi.
2. **Persetujuan Pencairan Dana (*Payout Approvals*)**: Memeriksa antrean permohonan penarikan saldo sewa host yang telah memenuhi syarat `RELEASED` sebelum mentransfer dana via BI-FAST.
3. **Penanganan Sengketa & Refund (*Dispute Center*)**: Menginvestigasi komplain menginap yang diajukan tamu sebelum batas 24 jam check-in untuk memutuskan apakah dana escrow dikembalikan ke tamu (`REFUNDED_TO_GUEST`) atau diteruskan ke host (`RELEASED`).
4. **Moderasi Listing (*Listing Moderation*)**: Menangguhkan (*suspend*) listing properti yang melanggar ketentuan layanan atau menerima komplain berulang dari pengguna.

---

## 6. Penyelarasan Fitur Komunikasi (Tamu & Tuan Rumah)

Sistem mengadopsi pendekatan **MVP Terintegrasi Langsung (Opsi A)** untuk menjamin stabilitas tanpa membebani server dengan *overhead* koneksi WebSockets/Socket.IO pada tahap awal:
* **Mekanisme Koordinasi**: Komunikasi resmi antara Tamu dan Tuan Rumah difasilitasi melalui saluran telepon seluler dan WhatsApp terverifikasi yang tercantum langsung pada dokumen **E-Voucher Digital (`/bookings/[id]/voucher`)**.
* **Keamanan Privasi**: Nomor telepon dan kontak hanya diungkapkan kepada pihak lawan transaksi **setelah** pesanan berhasil dibayar dan berstatus `CONFIRMED`.
* **Nama Panggilan**: Atribut `preferredName` digunakan sebagai sapaan ramah pada kartu e-voucher, konfirmasi email, dan tampilan ulasan.

---

## 7. Skema Entitas Basis Data Terkait (Prisma Schema)

Berikut adalah diagram relasi entitas inti yang siap diimplementasikan untuk mendukung seluruh arsitektur, keamanan transaksi, dan kelengkapan profil di atas:

```prisma
// ==========================================
// ENUMS
// ==========================================

enum Role {
  GUEST
  HOST
  ADMIN
}

enum KycStatus {
  UNVERIFIED
  PENDING
  VERIFIED
  REJECTED
}

enum BookingStatus {
  PENDING
  CONFIRMED
  COMPLETED
  CANCELLED
  DISPUTED
}

enum PaymentStatus {
  PENDING
  PAID
  FAILED
  REFUNDED
  EXPIRED
}

enum EscrowStatus {
  HELD
  RELEASED
  REFUNDED_TO_GUEST
}

enum PayoutStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
}

enum CancellationPolicy {
  FLEXIBLE   // Refund 100% hingga H-1 check-in
  MODERATE   // Refund 100% hingga H-5 check-in
  STRICT     // Refund 50% hingga H-7 check-in
}

// ==========================================
// MODELS
// ==========================================

// 1. Pengguna & Identitas
model User {
  id                       String            @id @default(cuid())
  name                     String?           // Nama Resmi (sesuai KTP/Paspor)
  preferredName            String?           // Nama Panggilan Pilihan
  email                    String?           @unique
  password                 String?
  emailVerified            DateTime?
  image                    String?
  phoneNumber              String?
  address                  String?           @db.Text

  // Kontak Darurat
  emergencyContactName     String?
  emergencyContactPhone    String?
  emergencyContactRelation String?

  // Verifikasi Identitas (KYC)
  kycStatus                KycStatus         @default(UNVERIFIED)
  idCardUrl                String?

  role                     Role              @default(GUEST)
  createdAt                DateTime          @default(now())
  updatedAt                DateTime          @updatedAt

  accounts                 Account[]
  sessions                 Session[]
  properties               Property[]        // Listing milik Host
  bookings                 Booking[]         // Pesanan menginap milik Tamu
  reviews                  Review[]          // Ulasan yang ditulis Tamu
  favorites                Favorite[]        // Wishlist pengguna
  bankAccount              HostBankAccount?  // Rekening bank Host (BI-FAST)
  payouts                  Payout[]          // Riwayat penarikan dana Host
}

// 2. Listing Penginapan
model Property {
  id                 String             @id @default(cuid())
  hostId             String
  title              String
  description        String             @db.Text
  category           String             @default("VILLA") // Contoh: "BEACH", "VILLA", "ICONIC", "URBAN"
  price              Float              // Tarif dasar per malam
  cleaningFee        Float              @default(0)
  latitude           Float
  longitude          Float
  address            String             @db.Text
  maxGuests          Int                @default(1)
  amenities          String[]           @default([])
  imageUrls          String[]           @default([])
  cancellationPolicy CancellationPolicy @default(FLEXIBLE)
  isPublished        Boolean            @default(true)
  createdAt          DateTime           @default(now())
  updatedAt          DateTime           @updatedAt

  host               User               @relation(fields: [hostId], references: [id], onDelete: Cascade)
  bookings           Booking[]
  blockedDates       BlockedDate[]
  reviews            Review[]
  favorites          Favorite[]

  @@index([hostId])
  @@index([category])
}

// 3. Transaksi Pemesanan & Pembayaran
model Booking {
  id              String        @id @default(cuid())
  propertyId      String
  guestId         String
  startDate       DateTime
  endDate         DateTime
  guestsCount     Int           @default(1)

  // Snapshot Rincian Biaya Saat Checkout
  nightlyRate     Float
  totalNights     Int
  cleaningFee     Float         @default(0)
  serviceFee      Float         @default(0)
  totalPrice      Float

  status          BookingStatus @default(PENDING)
  paymentStatus   PaymentStatus @default(PENDING)
  escrowStatus    EscrowStatus  @default(HELD)

  midtransOrderId String?       @unique
  midtransToken   String?       @db.Text
  expiresAt       DateTime?     // Batas waktu pembayaran sebelum auto-cancel
  cancelReason    String?       @db.Text

  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  property        Property      @relation(fields: [propertyId], references: [id], onDelete: Cascade)
  guest           User          @relation(fields: [guestId], references: [id], onDelete: Cascade)
  reviews         Review[]

  @@index([propertyId, startDate, endDate])
  @@index([guestId])
}

// 4. Tanggal Terblokir Manual oleh Host
model BlockedDate {
  id         String   @id @default(cuid())
  propertyId String
  startDate  DateTime
  endDate    DateTime
  reason     String?  // Contoh: "Renovasi", "Keperluan Keluarga"
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  property   Property @relation(fields: [propertyId], references: [id], onDelete: Cascade)

  @@index([propertyId, startDate, endDate])
}

// 5. Ulasan & Rating (Hanya untuk Booking yang COMPLETED)
model Review {
  id         String   @id @default(cuid())
  bookingId  String
  propertyId String
  guestId    String
  rating     Int      // Skala 1 s/d 5
  comment    String   @db.Text
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  booking    Booking  @relation(fields: [bookingId], references: [id], onDelete: Cascade)
  property   Property @relation(fields: [propertyId], references: [id], onDelete: Cascade)
  guest      User     @relation(fields: [guestId], references: [id], onDelete: Cascade)

  @@index([propertyId])
}

// 6. Wishlist / Koleksi Favorit
model Favorite {
  id         String   @id @default(cuid())
  userId     String
  propertyId String
  createdAt  DateTime @default(now())

  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  property   Property @relation(fields: [propertyId], references: [id], onDelete: Cascade)

  @@unique([userId, propertyId])
}

// 7. Rekening Bank Host (BI-FAST)
model HostBankAccount {
  id            String   @id @default(cuid())
  userId        String   @unique
  bankCode      String   @default("BCA") // Kode bank BI-FAST
  bankName      String
  accountNumber String
  accountHolder String
  isVerified    Boolean  @default(false)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

// 8. Pencairan Dana Sewa (Payout)
model Payout {
  id            String       @id @default(cuid())
  userId        String
  amount        Float
  status        PayoutStatus @default(PENDING)
  bankName      String
  accountNumber String
  accountHolder String
  notes         String?      @db.Text
  processedAt   DateTime?
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt

  user          User         @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, status])
}
```

---
*Dokumentasi ini dibuat untuk referensi pengembang, penguji sistem, serta dokumentasi produk Ruang Rehat.*
