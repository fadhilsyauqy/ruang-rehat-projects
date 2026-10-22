# Panduan Alur Bisnis, Hak Akses Peran, dan Katalog Fitur Sistem
**Aplikasi Platform Sewa Penginapan & Villa (Ruang Rehat)**

Dokumen ini disusun sebagai referensi teknis dan operasional komprehensif mengenai **alur bisnis (*business flow*)**, **matriks peran (*roles & permissions*)**, serta **efek sistem dari setiap fitur yang dieksekusi** pada aplikasi Ruang Rehat.

---

## Daftar Isi
1. [Model & Alur Bisnis Inti (Core Business Flow)](#1-model--alur-bisnis-inti-core-business-flow)
   - [A. Ekosistem Marketplace & Rekening Bersama (Escrow)](#a-ekosistem-marketplace--rekening-bersama-escrow)
   - [B. Siklus Transaksi Reservasi dari Hulu ke Hilir](#b-siklus-transaksi-reservasi-dari-hulu-ke-hilir)
   - [C. Aturan Pembatalan & Pengembalian Dana (Cancellation & Refund Policy)](#c-aturan-pembatalan--pengembalian-dana-cancellation--refund-policy)
   - [D. Alur Kepatuhan, Keamanan & Verifikasi Identitas (KYC)](#d-alur-kepatuhan-keamanan--verifikasi-identitas-kyc)
2. [Peran Pengguna (Roles) & Ruang Lingkup Wewenang](#2-peran-pengguna-roles--ruang-lingkup-wewenang)
   - [A. Tamu (GUEST)](#a-tamu-guest)
   - [B. Tuan Rumah (HOST)](#b-tuan-rumah-host)
   - [C. Pengelola Platform (ADMIN)](#c-pengelola-platform-admin)
   - [D. Matriks Hak Akses Antar Role](#d-matriks-hak-akses-antar-role)
3. [Katalog Fitur & Efek Sistem Saat Digunakan](#3-katalog-fitur--efek-sistem-saat-digunakan)
   - [Fitur 1: Pencarian Cerdas & Filter Multi-Kriteria Spasial](#fitur-1-pencarian-cerdas--filter-multi-kriteria-spasial)
   - [Fitur 2: Wishlist (Simpan Properti Favorit)](#fitur-2-wishlist-simpan-properti-favorit)
   - [Fitur 3: Pembuatan Reservasi (Booking Engine) & Penguncian Kalender](#fitur-3-pembuatan-reservasi-booking-engine--penguncian-kalender)
   - [Fitur 4: Pembayaran Midtrans Gateway & Penahanan Dana Escrow](#fitur-4-pembayaran-midtrans-gateway--penahanan-dana-escrow)
   - [Fitur 5: Penerbitan & Validasi E-Voucher Digital (Boarding Pass + QR Code)](#fitur-5-penerbitan--validasi-e-voucher-digital-boarding-pass--qr-code)
   - [Fitur 6: Pembatalan Pemesanan oleh Tamu / Host & Eksekusi Refund](#fitur-6-pembatalan-pemesanan-oleh-tamu--host--eksekusi-refund)
   - [Fitur 7: Ulasan & Penilaian Reputasi (Review System)](#fitur-7-ulasan--penilaian-reputasi-review-system)
   - [Fitur 8: Pendaftaran Properti Baru & Auto-Upgrade Peran ke HOST](#fitur-8-pendaftaran-properti-baru--auto-upgrade-peran-ke-host)
   - [Fitur 9: Pengeditan Properti & Penetapan Tarif Multi-Mata Uang (IDR/USD)](#fitur-9-pengeditan-properti--penetapan-tarif-multi-mata-uang-idrusd)
   - [Fitur 10: Manajemen Kalender & Pemblokiran Tanggal Mandiri (Blocked Dates)](#fitur-10-manajemen-kalender--pemblokiran-tanggal-mandiri-blocked-dates)
   - [Fitur 11: Pendaftaran Rekening Bank BI-FAST & Permohonan Pencairan Dana (Payout)](#fitur-11-pendaftaran-rekening-bank-bi-fast--permohonan-pencairan-dana-payout)
   - [Fitur 12: Audit Verifikasi Identitas (KYC Verification) oleh Admin](#fitur-12-audit-verifikasi-identitas-kyc-verification-oleh-admin)
   - [Fitur 13: Persetujuan & Eksekusi Payout oleh Admin](#fitur-13-persetujuan--eksekusi-payout-oleh-admin)
   - [Fitur 14: Pengaturan Akun, Keamanan, Privasi UU PDP & Profil (/profile)](#fitur-14-pengaturan-akun-keamanan-privasi-uu-pdp--profil-profile)
   - [Fitur 15: Konfigurasi Dwibahasa, Multi-Mata Uang & Tema Gelap/Terang](#fitur-15-konfigurasi-dwibahasa-multi-mata-uang--tema-gelapterang)
4. [Diagram Ringkasan State Machine Transaksi](#4-diagram-ringkasan-state-machine-transaksi)

---

## 1. Model & Alur Bisnis Inti (Core Business Flow)

### A. Ekosistem Marketplace & Rekening Bersama (Escrow)
Aplikasi beroperasi dengan model bisnis **Hospitality Marketplace dua sisi (*Two-Sided Marketplace*)**:
1. **Penyedia Kamar / Mitra (Host)** menawarkan unit properti hunian (Villa, Apartemen, Rumah, Kabin, Resort) dengan menetapkan harga per malam, biaya kebersihan, dan kebijakan pembatalan.
2. **Penyewa (Guest)** mencari hunian yang sesuai kriteria perjalanan, melakukan reservasi, dan membayar lunas di muka melalui gateway pembayaran resmi.
3. **Platform (Ruang Rehat)** bertindak sebagai perantara tepercaya (*trusted escrow intermediary*):
   - Menerima pembayaran tamu melalui gateway Midtrans (BCA/Mandiri/BRI/BNI Virtual Account, QRIS GoPay/ShopeePay, dan Kartu Kredit).
   - Membebankan biaya layanan platform (*service fee*) kepada penyewa sebagai pendapatan platform.
   - **Menahan dana sewa (*Escrow*)** hingga masa menginap tiba guna melindungi tamu dari penipuan (*fraud*) atau ketidaksesuaian fasilitas di lapangan.
   - Merilis dana sewa (*Released*) ke saldo dompet tuan rumah 24 jam setelah waktu *check-in*, dengan asumsi tidak terjadi sengketa (*dispute*).

---

### B. Siklus Transaksi Reservasi dari Hulu ke Hilir

```
[ TAMU (GUEST) ]
      │
      ├─ 1. Cari & Filter Properti (Lokasi, Tanggal, Tamu, Fasilitas, Budget)
      ├─ 2. Pilih Properti & Cek Kalkulasi Tarif Otomatis
      ├─ 3. Tekan "Pesan Sekarang" -> Buat Reservasi (Status: PENDING, Kalender Dikunci)
      │
      ▼
[ MIDTRANS PAYMENT GATEWAY ]
      │
      ├─ Batas waktu bayar: 60 Menit (expiresAt)
      │      ├─ Lewat 60 menit tanpa bayar ──► Booking CANCELLED, Kalender dibuka kembali
      │      └─ Tamu Membayar Lunas (VA / QRIS / Kartu Kredit)
      │
      ▼
[ SISTEM ESCROW PLATFORM ]
      │
      ├─ Status Booking berubah menjadi CONFIRMED
      ├─ Status Pembayaran menjadi PAID
      ├─ Status Escrow menjadi HELD (Dana aman di rekening penampung)
      ├─ E-Voucher Digital & QR Code resmi terbit untuk Tamu
      ├─ Notifikasi instan masuk ke Dashboard Tuan Rumah
      │
      ▼
[ HARI KEDATANGAN (CHECK-IN) ]
      │
      ├─ Tamu tiba di lokasi (Default SOP: 14:00 WIB)
      ├─ Tuan Rumah / Staf memindai QR Code E-Voucher Tamu untuk validasi identitas
      ├─ Tamu menikmati masa tinggal hingga waktu check-out (Default SOP: 12:00 WIB)
      │
      ▼
[ 24 JAM PASCA CHECK-IN ]
      │
      ├─ Tanpa Laporan Sengketa (No Dispute)
      ├─ Sistem otomatis mengubah EscrowStatus dari HELD menjadi RELEASED
      ├─ Saldo masuk ke "Available Balance" Tuan Rumah (Siap Ditarik)
      │
      ▼
[ PENARIKAN SALDO TUAN RUMAH (HOST PAYOUT) ]
      │
      ├─ Tuan Rumah mengajukan penarikan via rekening bank BI-FAST terdaftar
      ├─ Status Payout: PENDING
      ├─ Admin memverifikasi di panel `/admin/payouts` dan menyetujui transfer
      ├─ Status Payout: COMPLETED -> Dana masuk ke rekening pribadi Host
      │
      ▼
[ PENUTUPAN SIKLUS (REVIEW & REPUTATION) ]
      │
      └─ Booking berstatus COMPLETED -> Tamu menulis ulasan & bintang 1-5
```

---

### C. Aturan Pembatalan & Pengembalian Dana (Cancellation & Refund Policy)
Setiap properti tunduk pada salah satu dari 3 klausul pembatalan yang ditentukan oleh Host saat mendaftarkan listing:

| Kebijakan | Batas Waktu Pembatalan | Hak Refund Tamu | Penalti / Potongan |
| :--- | :--- | :--- | :--- |
| **`FLEXIBLE`** | Hingga **24 jam sebelum check-in** | **100% Pengembalian Penuh** | Tanpa potongan sewa malam |
| | Kurang dari 24 jam sebelum check-in | Refund sisa malam (50%) | Malam pertama hangus |
| **`MODERATE`** | Hingga **5 hari sebelum check-in** | **100% Pengembalian Penuh** | Tanpa potongan |
| | Kurang dari 5 hari sebelum check-in | 50% dari total tarif malam | 50% biaya menginap hangus |
| **`STRICT`** | Hingga **7 hari sebelum check-in** | **50% dari total tarif malam** | 50% biaya menginap hangus |
| | Kurang dari 7 hari sebelum check-in | **0% (Non-refundable)** | Tidak ada pengembalian dana |

*Jika pembatalan disetujui, dana di rekening bersama otomatis diperbarui menjadi `REFUNDED_TO_GUEST` dan status pembayaran menjadi `REFUNDED`.*

---

### D. Alur Kepatuhan, Keamanan & Verifikasi Identitas (KYC)
Untuk mencegah penipuan listing fiktif dan menjamin rasa aman bagi para tamu:
1. Setiap pengguna yang mendaftar memiliki status verifikasi `UNVERIFIED`.
2. Pengguna dapat mengunggah foto KTP/Paspor dan nomor identitas melalui menu profil `/profile`. Status identitas berubah menjadi `PENDING`.
3. Admin memverifikasi keabsahan dokumen di `/admin/kyc`.
4. Jika disetujui (`VERIFIED`), pengguna mendapatkan lencana resmi (*Verified Shield*).
5. **Kebijakan Listing Draft**: Jika seorang pengguna belum terverifikasi KYC mencoba membuat listing baru di `/properties/new`, listing otomatis berstatus draft (`isPublished: false`) hingga host menyelesaikan proses verifikasi identitas, menjaga katalog publik tetap aman dan tepercaya.

---

## 2. Peran Pengguna (Roles) & Ruang Lingkup Wewenang

Sistem membedakan hak akses pengguna menjadi 3 tingkat (*Role Hierarchy*):

### A. Tamu (`GUEST`)
* **Definisi**: Pengguna umum yang mencari dan menyewa akomodasi perjalanan. Ini adalah peran awal (*default*) setiap kali akun baru dibuat.
* **Tujuan Utama**: Menemukan hunian, memesan tanggal menginap, membayar secara aman, menikmati akomodasi dengan e-voucher resmi, dan memberikan ulasan.
* **Kapabilitas Utama**:
  - Menjelajahi katalog properti publik dan melihat detail lengkap fasilitas.
  - Menyimpan unit ke dalam koleksi favorit (*Wishlists*).
  - Melakukan reservasi dan pelunasan melalui Midtrans.
  - Membuka dan mencetak tiket digital resmi (*E-Voucher Boarding Pass*).
  - Melakukan pembatalan pesanan mandiri sesuai regulasi pembatalan yang berlaku.
  - Mengelola profil pribadi, privasi data, dan keamanan kata sandi di `/profile`.
  - **Pintu Masuk Hosting**: Dapat mendaftarkan akomodasi pertamanya di `/properties/new`. Begitu listing berhasil diterbitkan, peran akun otomatis ditingkatkan (*auto-promoted*) menjadi `HOST`.

---

### B. Tuan Rumah (`HOST`)
* **Definisi**: Mitra pemilik atau pengelola akomodasi yang menawarkan kamar, rumah, atau villa untuk disewa publik.
* **Tujuan Utama**: Memaksimalkan okupansi unit, mengelola ketersediaan kalender, menyambut tamu, dan mengelola penerimaan pendapatan sewa.
* **Kapabilitas Utama (Mencakup seluruh fitur GUEST ditambah)**:
  - Mengakses tab **Properti Saya (*Properties*)** di `/dashboard`: memantau performa, menambah listing baru, dan mengedit data properti.
  - Mengakses tab **Reservasi Masuk (*Incoming Bookings*)**: memantau tamu yang akan datang, melihat status bayar, dan mengakses kontak koordinasi tamu.
  - Mengakses tab **Kalender Ketersediaan (*Availability Calendar*)**: memblokir tanggal tertentu secara manual (misal renovasi atau penggunaan pribadi) dan membuka blokir tanggal.
  - Mengakses tab **Pendapatan & Pencairan (*Payouts*)**: mendaftarkan rekening bank tujuan pencairan (BCA, Mandiri, BRI, BNI, dll.) dan mengajukan penarikan dana sewa yang telah berstatus `RELEASED`.
  - Mengelola kebijakan operasional properti: tarif per malam dinamis (IDR/USD), biaya kebersihan (*cleaning fee*), daya tampung maksimal, dan amenitas.

---

### C. Pengelola Platform (`ADMIN`)
* **Definisi**: Auditor internal dan pengawas marketplace yang bertugas menjamin kepatuhan hukum, keamanan transaksi, dan kelancaran operasional keuangan.
* **Tujuan Utama**: Memverifikasi identitas pengguna, menyetujui mutasi perbankan, menengahi sengketa, dan memoderasi listing bermasalah.
* **Kapabilitas Utama**:
  - Mengakses pusat kendali khusus `/admin`.
  - Mengaudit dan menyetujui/menolak pengajuan verifikasi identitas pengguna (`/admin/kyc`).
  - Memeriksa antrean permohonan penarikan dana sewa host (`/admin/payouts`) dan mencairkannya via transfer perbankan BI-FAST.
  - Menengahi klaim sengketa menginap (*Dispute Resolution*) antara tamu dan tuan rumah sebelum dana escrow dirilis.
  - Mengawasi, menonaktifkan (*unpublish*), atau menghapus listing properti yang melanggar aturan komunitas.

---

### D. Matriks Hak Akses Antar Role

| Kapabilitas / Area Aplikasi | Tamu (`GUEST`) | Tuan Rumah (`HOST`) | Admin (`ADMIN`) |
| :--- | :---: | :---: | :---: |
| Cari, Filter, & Peta Interaktif (`/`) | ✅ | ✅ | ✅ |
| Kelola Koleksi Favorit (`/wishlists`) | ✅ | ✅ | ✅ |
| Buat Reservasi & Checkout (`/checkout/[id]`) | ✅ | ✅ | ✅ |
| Akses Tiket E-Voucher Digital (`/bookings/[id]/voucher`) | ✅ | ✅ | ✅ |
| Batalkan Reservasi Sesuai Kebijakan | ✅ | ✅ | ✅ |
| Beri Ulasan Bintang & Ulasan Pengalaman | ✅ | ✅ | ✅ |
| Pengaturan Akun & Keamanan (`/profile`) | ✅ | ✅ | ✅ |
| Daftarkan Listing Baru (`/properties/new`) | ✅ *(Auto-upgrade)* | ✅ | ❌ |
| Edit & Hapus Properti Milik Sendiri | ❌ | ✅ | ❌ |
| Blokir Tanggal Kalender Manual | ❌ | ✅ | ❌ |
| Lihat Daftar Reservasi Tamu Masuk | ❌ | ✅ | ❌ |
| Daftarkan Rekening Bank BI-FAST | ❌ | ✅ | ❌ |
| Tarik Saldo Sewa (*Request Payout*) | ❌ | ✅ | ❌ |
| Verifikasi KTP / Dokumen KYC | ❌ | ❌ | ✅ |
| Setujui / Tolak Pencairan Dana (*Approve Payout*) | ❌ | ❌ | ✅ |
| Penanganan Sengketa & Arbitrase Escrow | ❌ | ❌ | ✅ |

---

## 3. Katalog Fitur & Efek Sistem Saat Digunakan

Berikut adalah rincian teknis mengenai apa yang terjadi di lapisan antarmuka, logika bisnis, dan basis data saat setiap fitur digunakan:

---

### Fitur 1: Pencarian Cerdas & Filter Multi-Kriteria Spasial
* **Rute**: `/` (Halaman Beranda)
* **Pengguna**: Semua Pengunjung & Pengguna Terdaftar (`GUEST`, `HOST`, `ADMIN`).
* **Cara Penggunaan**:
  Pengguna mengetik nama destinasi di kolom pencarian, memilih tanggal rencana perjalanan (*Check-in* & *Check-out*), menentukan jumlah tamu, memilih kategori ikonik (Pantai, Villa, Modern, Kabin), menggeser rentang harga dinamis, dan memilih fasilitas yang diinginkan.
* **Apa yang Terjadi di Sistem Saat Fitur Digunakan**:
  1. Parameter URL tersinkronisasi secara otomatis (contoh: `?location=Bali&category=VILLA&minPrice=500000&maxPrice=2500000&guests=2`).
  2. Kueri Prisma membaca basis data dengan menyaring properti yang memenuhi kriteria:
     - `isPublished: true` (hanya menampilkan properti terverifikasi).
     - Rentang harga dihitung berdasarkan kurs mata uang aktif (IDR vs USD).
     - Ketersediaan tanggal divalidasi silang terhadap data `Booking` (status `CONFIRMED`) dan data `BlockedDate` pada properti tersebut. Unit yang telah terisi atau diblokir pada rentang tanggal tersebut akan dieliminasi dari hasil pencarian.
  3. Peta interaktif Leaflet/Mapbox memperbarui penanda koordinat (*pins*) secara real-time menyesuaikan properti yang lolos filter.

---

### Fitur 2: Wishlist (Simpan Properti Favorit)
* **Rute**: `/` & `/wishlists`
* **Pengguna**: Pengguna terautentikasi (`GUEST`, `HOST`, `ADMIN`).
* **Cara Penggunaan**:
  Mengetuk tombol ikon hati (*Heart Icon*) di pojok kanan atas kartu properti di katalog manapun.
* **Apa yang Terjadi di Sistem Saat Fitur Digunakan**:
  1. Sistem memeriksa sesi login pengguna. Jika belum login, dialihkan ke `/signin`.
  2. Request dikirim ke API `/api/favorites`:
     - **Jika belum tersimpan**: Record baru dibuat di tabel `Favorite` (`userId` + `propertyId`). Ikon hati berubah menjadi merah solid dengan animasi mikro.
     - **Jika sudah tersimpan**: Record dihapus dari tabel `Favorite`. Ikon hati kembali menjadi transparan/outline.
  3. Halaman `/wishlists` mengelompokkan seluruh hunian yang disukai ke dalam grid 5-kolom responsif, memungkinkan akses instan tanpa perlu mencari ulang.

---

### Fitur 3: Pembuatan Reservasi (Booking Engine) & Penguncian Kalender
* **Rute**: `/properties/[id]`
* **Pengguna**: `GUEST`, `HOST`, `ADMIN` (kecuali memesan properti miliknya sendiri).
* **Cara Penggunaan**:
  Tamu memilih tanggal *check-in* dan *check-out* di kartu pemesanan, memilih jumlah tamu (tidak boleh melebihi `maxGuests`), lalu menekan tombol **"Pesan Sekarang"**.
* **Apa yang Terjadi di Sistem Saat Fitur Digunakan**:
  1. **Validasi Anti-Bentrok (*Double Booking Prevention*)**: Sistem memverifikasi kembali di basis data apakah rentang tanggal yang dipilih tumpang tindih (*overlap*) dengan pesanan terkonfirmasi atau pemblokiran mandiri host.
  2. **Kalkulasi Biaya Transparan**:
     - `totalNights` = selisih hari tanggal check-out dikurangi check-in.
     - `nightlyRate` = harga sewa per malam.
     - `cleaningFee` = biaya kebersihan yang ditentukan host.
     - `serviceFee` = biaya penanganan operasional platform (persentase standar industri).
     - `totalPrice` = `(nightlyRate * totalNights) + cleaningFee + serviceFee`.
  3. **Pembuatan Record Booking**:
     - Dibuat baris baru di tabel `Booking` dengan `status: PENDING`, `paymentStatus: PENDING`, `escrowStatus: HELD`.
     - Atribut `expiresAt` diset ke `now() + 60 menit`. Tanggal di kalender seketika dikunci sementara bagi calon tamu lain.
  4. Pengguna langsung diarahkan ke halaman pembayaran terintegrasi `/checkout/[bookingId]`.

---

### Fitur 4: Pembayaran Midtrans Gateway & Penahanan Dana Escrow
* **Rute**: `/checkout/[id]`, `/api/payment`, `/api/webhooks/midtrans`
* **Pengguna**: Tamu yang memiliki reservasi berstatus `PENDING`.
* **Cara Penggunaan**:
  Tamu memilih metode bayar di antarmuka Midtrans Snap (Virtual Account bank lokal, QRIS, atau Kartu Kredit) lalu menyelesaikan pembayaran di aplikasi m-banking atau e-wallet mereka.
* **Apa yang Terjadi di Sistem Saat Fitur Digunakan**:
  1. Midtrans memproses transaksi secara aman.
  2. Saat pembayaran terdeteksi sukses, webhook Midtrans mengirimkan notifikasi ke `/api/webhooks/midtrans`:
     - `Booking.status` diperbarui dari `PENDING` menjadi `CONFIRMED`.
     - `Booking.paymentStatus` diperbarui menjadi `PAID`.
     - `Booking.escrowStatus` tetap berstatus `HELD` (dana diamankan di penampungan platform).
  3. **Jika Pembayaran Kedaluwarsa / Dibatalkan**:
     - Webhook mendeteksi status `expire` atau `cancel`.
     - `Booking.status` berubah menjadi `CANCELLED`.
     - `Booking.paymentStatus` berubah menjadi `EXPIRED`.
     - Kuncian tanggal kalender dilepaskan, sehingga unit dapat kembali dipesan oleh pengguna lain.
  4. Tamu diarahkan ke halaman konfirmasi e-voucher resmi.

---

### Fitur 5: Penerbitan & Validasi E-Voucher Digital (Boarding Pass + QR Code)
* **Rute**: `/bookings/[id]/voucher`
* **Pengguna**: Tamu yang telah lunas bayar (`CONFIRMED`), Host pemilik unit, dan Admin.
* **Cara Penggunaan**:
  Tamu membuka tautan voucher dari tab *Perjalanan Saya* di dashboard, menyimpannya di ponsel pintar, atau mencetaknya ke format kertas A4/PDF melalui tombol **"Cetak E-Voucher"**.
* **Apa yang Terjadi di Sistem Saat Fitur Digunakan**:
  1. Halaman merender layout tiket *boarding pass* 2-kolom:
     - **Kolom Rincian**: Alamat fisik akomodasi, nama tamu resmi, tanggal dan jam *check-in* (14:00) & *check-out* (12:00), nomor kontak darurat, dan ringkasan fasilitas.
     - **Kolom Stub / Verifikasi**: Menghasilkan **QR Code kriptografis unik** berbasis ID pemesanan dan token verifikasi.
     - **Penyelarasan Kontak**: Mengungkapkan nomor telepon resmi dan tautan WhatsApp host untuk koordinasi penjemputan/kunci kamar.
  2. Saat tamu tiba di penginapan, Host dapat memindai QR code tersebut menggunakan kamera ponsel untuk memvalidasi identitas tamu seketika tanpa berkas fisik yang rumit.
  3. Format cetak (*print-safe media queries*) dioptimalkan secara presisi agar pas dalam 1 lembar dokumen standar A4 tanpa terpotong.

---

### Fitur 6: Pembatalan Pemesanan oleh Tamu / Host & Eksekusi Refund
* **Rute**: `/dashboard?tab=trips` (Tamu) atau `/dashboard?tab=bookings` (Host)
* **Pengguna**: Pemesan akomodasi atau Pemilik properti.
* **Cara Penggunaan**:
  Pengguna memilih kartu pesanan aktif, menekan tombol **"Batalkan Pemesanan"**, dan memasukkan alasan pembatalan pada dialog konfirmasi.
* **Apa yang Terjadi di Sistem Saat Fitur Digunakan**:
  1. **Jika Dibatalkan oleh Tamu**:
     - Sistem membandingkan waktu pembatalan terhadap waktu *check-in* (`startDate`) dan memeriksa klausul `CancellationPolicy` properti (`FLEXIBLE`, `MODERATE`, atau `STRICT`).
     - Menghitung persentase dana yang berhak dikembalikan (100%, 50%, atau 0%).
     - Status booking berubah menjadi `CANCELLED`.
     - Jika ada pengembalian: `Booking.escrowStatus` berubah menjadi `REFUNDED_TO_GUEST`, `PaymentStatus` menjadi `REFUNDED`, dan instruksi refund diteruskan ke sistem pembayaran.
  2. **Jika Dibatalkan oleh Tuan Rumah**:
     - Dana sewa dikembalikan 100% penuh kepada tamu tanpa penalti ke tamu.
     - Tanggal kalender otomatis dibuka kembali untuk disewa pengguna lain.

---

### Fitur 7: Ulasan & Penilaian Reputasi (Review System)
* **Rute**: `/dashboard?tab=trips` & `/api/reviews`
* **Pengguna**: Tamu yang telah menyelesaikan masa menginap (`Booking.status: COMPLETED`).
* **Cara Penggunaan**:
  Tamu memilih perjalanan lampau yang telah selesai, menekan tombol **"Tulis Ulasan"**, memilih rating bintang 1 hingga 5, dan menuliskan ulasan pengalaman menginap.
* **Apa yang Terjadi di Sistem Saat Fitur Digunakan**:
  1. Validasi sistem memastikan bahwa pengguna benar-benar merupakan tamu terverifikasi dari pesanan tersebut dan pesanan telah berstatus selesai.
  2. Data tersimpan di tabel `Review` dengan relasi ke `Property`, `User` (Guest), dan `Booking`.
  3. Nilai skor rata-rata (*average rating*) properti dan total hitungan ulasan dihitung ulang secara instan.
  4. Komentar dan rating muncul pada halaman detail properti untuk membantu calon tamu berikutnya membuat keputusan sewa yang tepat.

---

### Fitur 8: Pendaftaran Properti Baru & Auto-Upgrade Peran ke HOST
* **Rute**: `/properties/new`
* **Pengguna**: Semua pengguna yang ingin menyewakan tempatnya (`GUEST` atau `HOST`).
* **Cara Penggunaan**:
  Pengguna mengisi nama listing, deskripsi, memilih kategori, menentukan harga per malam dan biaya kebersihan dalam mata uang pilihannya (IDR/USD), titik koordinat peta, alamat lengkap, mencentang amenitas, dan mengunggah foto-foto unit.
* **Apa yang Terjadi di Sistem Saat Fitur Digunakan**:
  1. Foto diunggah secara aman dan menghasilkan URL publik.
  2. Nilai harga yang dimasukkan (misal dalam IDR) secara otomatis dikonversi ke basis data USD (1 USD = 15.000 IDR) sebelum disimpan di basis data.
  3. Baris baru dibuat di tabel `Property`.
  4. **Pemeriksaan Kepatuhan KYC**:
     - Jika pengguna telah berstatus `kycStatus: VERIFIED`, listing langsung tayang (`isPublished: true`).
     - Jika pengguna belum terverifikasi KYC, listing disimpan sebagai draft (`isPublished: false`) dan dialog panduan verifikasi KTP otomatis muncul.
  5. **Auto-Promote Role**: Jika peran pengguna sebelumnya adalah `GUEST`, sistem otomatis memperbarui peran pengguna menjadi `HOST` (`prisma.user.update({ data: { role: 'HOST' } })`), membuka akses ke menu dashboard operasional.

---

### Fitur 9: Pengeditan Properti & Penetapan Tarif Multi-Mata Uang (IDR/USD)
* **Rute**: `/properties/[id]/edit`
* **Pengguna**: Tuan Rumah pemilik properti terkait.
* **Cara Penggunaan**:
  Host mengubah informasi properti, mengganti foto, atau mengubah tarif sewa. Host dapat memilih apakah ingin memasukkan angka dalam Rupiah (`IDR`) atau Dolar (`USD`) melalui pill switch mata uang.
* **Apa yang Terjadi di Sistem Saat Fitur Digunakan**:
  1. Otorisasi sistem memeriksa kepemilikan (`property.hostId === session.user.id`). Jika bukan pemiliknya, sistem memblokir akses dan mengalihkan ke `/dashboard`.
  2. Komponen formulir secara cerdas membaca nilai tersimpan dalam USD, lalu otomatis mengonversikannya ke mata uang aktif pengguna saat formulir dimuat (misal $100 dikonversi menjadi Rp 1.500.000 jika menggunakan IDR).
  3. Pergantian pill mata uang secara dinamis mengonversi angka yang sedang diketik secara instan di layar, lengkap dengan badge live preview estimasi ekuivalennya.
  4. Saat tombol **"Simpan Perubahan"** ditekan, request PUT dikirimkan ke `/api/properties/[id]`, memperbarui data listing di basis data.

---

### Fitur 10: Manajemen Kalender & Pemblokiran Tanggal Mandiri (Blocked Dates)
* **Rute**: `/dashboard?tab=availability` & `/api/properties/blocked-dates`
* **Pengguna**: Tuan Rumah (`HOST`).
* **Cara Penggunaan**:
  Host memilih salah satu unit propertinya, memilih rentang tanggal awal dan akhir yang ingin ditutup, mengisi alasan (contoh: "Renovasi atap" atau "Dipakai liburan keluarga"), lalu menekan tombol **"Blokir Tanggal"**.
* **Apa yang Terjadi di Sistem Saat Fitur Digunakan**:
  1. Sistem memvalidasi bahwa tanggal yang dipilih berada di masa depan dan tidak menabrak pesanan tamu yang sudah berstatus `CONFIRMED`.
  2. Rekord baru disimpan di tabel `BlockedDate` (`propertyId`, `startDate`, `endDate`, `reason`).
  3. Kalender ketersediaan properti langsung diperbarui:
     - Tanggal tersebut diberi tanda khusus di tampilan kalender host.
     - Di sisi calon tamu, tanggal tersebut langsung dinonaktifkan (*disabled*) pada *date picker*, sehingga tamu tidak dapat memilih tanggal tersebut.
  4. Host dapat membuka kembali pemblokiran kapan saja dengan menekan tombol **"Buka Blokir"**, yang akan menghapus baris terkait di tabel `BlockedDate`.

---

### Fitur 11: Pendaftaran Rekening Bank BI-FAST & Permohonan Pencairan Dana (Payout)
* **Rute**: `/dashboard?tab=payouts`, `/api/host/bank-account`, `/api/host/payouts`
* **Pengguna**: Tuan Rumah (`HOST`).
* **Cara Penggunaan**:
  1. Host mendaftarkan rekening bank pencairan (Pilih nama bank: BCA, Mandiri, BRI, BNI, CIMB, dll., ketik nomor rekening, dan nama pemilik).
  2. Saat ada saldo sewa yang telah berstatus `RELEASED`, Host memasukkan nominal dana yang ingin ditarik lalu menekan **"Ajukan Pencairan"**.
* **Apa yang Terjadi di Sistem Saat Fitur Digunakan**:
  1. **Pada Pendaftaran Rekening**:
     - Sistem memvalidasi format rekening dan menyimpannya di tabel `HostBankAccount`.
     - Status rekening diverifikasi untuk transaksi BI-FAST.
  2. **Pada Pengajuan Pencairan**:
     - Sistem menghitung saldo tersedia: `Total nominal booking berstatus RELEASED` dikurangi `total payout yang berstatus PENDING, PROCESSING, atau COMPLETED`.
     - Validasi memastikan nominal penarikan tidak melebihi saldo tersedia dan memenuhi batas minimum penarikan.
     - Dibuat rekord baru di tabel `Payout` dengan `status: PENDING`.
     - Pengajuan masuk ke antrean audit Admin di panel `/admin/payouts`. Saldo yang dapat ditarik (*Available Balance*) langsung terpotong secara transparan agar tidak terjadi penarikan ganda.

---

### Fitur 12: Audit Verifikasi Identitas (KYC Verification) oleh Admin
* **Rute**: `/admin/kyc`, `/api/admin/kyc/[id]`
* **Pengguna**: Pengelola Platform (`ADMIN`).
* **Cara Penggunaan**:
  Admin membuka antrean pengguna yang telah mengunggah berkas KTP/Paspor, memeriksa kejelasan foto dokumen dan kecocokan nomor identitas, lalu menekan tombol **"Setujui (Verify)"** atau **"Tolak (Reject)"** (disertai alasan penolakan).
* **Apa yang Terjadi di Sistem Saat Fitur Digunakan**:
  1. **Jika Disetujui**:
     - `User.kycStatus` diperbarui menjadi `VERIFIED`.
     - Lencana verifikasi resmi langsung aktif di profil pengguna.
     - Seluruh listing draft milik pengguna tersebut otomatis diaktifkan menjadi `isPublished: true` sehingga mulai tayang di katalog publik.
  2. **Jika Ditolak**:
     - `User.kycStatus` diperbarui menjadi `REJECTED`.
     - Kolom `User.kycRejectReason` menyimpan catatan alasan penolakan (misal: "Foto KTP buram, silakan unggah ulang").
     - Pengguna dapat membaca catatan tersebut di halaman profilnya dan mengunggah ulang dokumen yang benar.

---

### Fitur 13: Persetujuan & Eksekusi Payout oleh Admin
* **Rute**: `/admin/payouts`, `/api/admin/payouts/[id]`
* **Pengguna**: Pengelola Platform (`ADMIN`).
* **Cara Penggunaan**:
  Admin meninjau antrean permohonan penarikan dana sewa host, memeriksa rincian rekening bank BI-FAST penerima, lalu menekan tombol **"Proses Transfer / Setujui"**.
* **Apa yang Terjadi di Sistem Saat Fitur Digunakan**:
  1. Validasi memastikan permohonan payout masih berstatus `PENDING`.
  2. Sistem memperbarui status:
     - `Payout.status` berubah menjadi `COMPLETED`.
     - `Payout.processedAt` diset ke stempel waktu saat ini (`now()`).
     - Nomor referensi transfer bank dicatat di kolom catatan.
  3. Dashboard host otomatis memperbarui status penarikan menjadi sukses (*Completed*) dan mengirimkan notifikasi konfirmasi ke email/dashboard host.

---

### Fitur 14: Pengaturan Akun, Keamanan, Privasi UU PDP & Profil (/profile)
* **Rute**: `/profile`
* **Pengguna**: Semua Pengguna Terdaftar (`GUEST`, `HOST`, `ADMIN`).
* **Cara Penggunaan**:
  Pengguna membuka halaman profil modular, memilih tab yang ingin disesuaikan (Informasi Pribadi, Keamanan, Privasi UU PDP, Notifikasi, atau Penagihan Perusahaan), mengedit data secara *inline*, lalu menekan **"Simpan Perubahan"**.
* **Apa yang Terjadi di Sistem Saat Fitur Digunakan**:
  1. **Informasi Pribadi**: Memperbarui nama resmi, foto profil, nama panggilan (*preferredName*), kontak darurat, dan alamat domisili.
  2. **Ganti Kata Sandi**: Sistem memeriksa kecocokan kata sandi lama via `bcrypt.compare`. Jika benar, kata sandi baru di-hash dengan *salt rounds* berstandar industri dan diperbarui di basis data.
  3. **Kepatuhan Privasi UU PDP**:
     - Opsi `hideLastNameReview`: Menyamarkan nama belakang tamu pada kartu ulasan publik menjadi inisial (misal: "Budi S." alih-alih "Budi Santoso").
     - Opsi `hideSearchEngines`: Memasang tag proteksi anti-indeks mesin pencari terhadap halaman profil pengguna.
  4. **Preferensi Notifikasi**: Mengatur preferensi penerimaan email pengingat menginap (H-1), notifikasi reservasi masuk bagi host, dan info penarikan dana.

---

### Fitur 15: Konfigurasi Dwibahasa, Multi-Mata Uang & Tema Gelap/Terang
* **Rute**: Bilah Navigasi Atas (*Navbar*) & `/profile` (Tab Preferensi Global)
* **Pengguna**: Semua Pengunjung & Pengguna.
* **Cara Penggunaan**:
  Memilih preferensi pada menu dropdown atau sakelar tombol:
  - Bahasa: **Bahasa Indonesia (ID)** atau **English (EN)**.
  - Mata Uang: **IDR (Rp)** atau **USD ($)**.
  - Tema: **Light Mode**, **Dark Mode**, atau **Sistem**.
* **Apa yang Terjadi di Sistem Saat Fitur Digunakan**:
  1. Pilihan disimpan di *cookies* peramban (`lang`, `currency`, `theme`) dengan path global `/`.
  2. Komponen Server (`Server Components`) membaca cookie tersebut pada setiap request masuk:
     - Memuat kamus terjemahan yang sesuai dari `src/lib/dictionary.ts`.
     - Mengalikan atau membagi harga katalog secara proporsional (menggunakan kurs acuan 1 USD = 15.000 IDR).
  3. Tema visual disuntikkan ke elemen dokumen HTML (`class="dark"` atau `class="light"`), memberikan kenyamanan visual secara instan tanpa perlu memuat ulang seluruh halaman (*zero flicker*).

---

## 4. Diagram Ringkasan State Machine Transaksi

Berikut adalah peta perubahan status entitas utama selama transaksi berlangsung di platform Ruang Rehat:

```
[ PEMESANAN (BOOKING) ]
       │
   (Tamu Klik Pesan)
       ▼
   [ PENDING ] ──(60 Menit Tak Dibayar / Batal)──► [ CANCELLED ]
       │
   (Pembayaran Sukses via Midtrans)
       ▼
  [ CONFIRMED ] ──(Dibatalkan Host/Tamu)─────────► [ CANCELLED ]
       │
   (Check-in & Selesai Menginap)
       ▼
  [ COMPLETED ] ──(Tamu Menulis Ulasan)──────────► [ REVIEWS RECORDED ]
```

```
[ PEMBAYARAN (PAYMENT) ]
       │
   [ PENDING ] ──(Batas Waktu Habis)─────────────► [ EXPIRED ]
       │
   (Lunas Diterima Gateway)
       ▼
     [ PAID ] ──(Refund Disetujui)───────────────► [ REFUNDED ]
```

```
[ REKENING BERSAMA (ESCROW) ]
       │
   (Dana Diterima saat Booking Confirmed)
       ▼
     [ HELD ] ──(Pembatalan Berhak Refund)───────► [ REFUNDED_TO_GUEST ]
       │
   (24 Jam Pasca Check-in & Tanpa Sengketa)
       ▼
   [ RELEASED ] (Masuk ke Saldo Siap Tarik Host)
       │
   (Host Ajukan Penarikan Dana)
       ▼
 [ PAYOUT: PENDING ] ──(Admin Setujui & Transfer)─► [ PAYOUT: COMPLETED ]
```

---

*Dokumen ini dirancang sebagai panduan tunggal kebenaran (*single source of truth*) operasional arsitektur platform Ruang Rehat.*
