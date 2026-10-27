# 🎨 Task Resolusi UI/UX Edge Cases & Sinkronisasi Frontend — Ruang Rehat

Dokumen ini adalah **panduan kerja resmi (*Single Source of Truth*)** untuk pelaksanaan audit menyeluruh dan perbaikan antarmuka pengguna (UI/UX), penanganan skenario ekstrem (*edge cases*), eliminasi dialog browser kaku, standarisasi notifikasi, serta sinkronisasi validasi sisi klien (*client-side*) dengan backend yang telah diamankan pada platform Ruang Rehat.

Setiap task disusun secara berurutan (*phased implementation*) dengan kriteria pengujian ketat guna menjamin konsistensi pengalaman pengguna dan **0 error TypeScript (`npx tsc --noEmit`)**.

---

## 📌 Ringkasan Status Eksekusi

| Fase / Area | Fokus Audit & Perbaikan | Status | Jumlah Task |
| :--- | :--- | :---: | :---: |
| **Fase 1** | Sistem Toast Notification Terpusat & Eliminasi `alert()` / `confirm()` | `COMPLETED` | 4 Task |
| **Fase 2** | Standarisasi Loading State & Proteksi Anti Double-Click | `PENDING` | 4 Task |
| **Fase 3** | Pengerasan Edge Cases Alur Pembayaran Midtrans Snap | `PENDING` | 3 Task |
| **Fase 4** | Sinkronisasi Validasi Sisi Klien (Upload Berkas & Seleksi Kalender) | `PENDING` | 3 Task |
| **Fase 5** | Komponen Empty States Komprehensif & Aksi Reset Filter | `PENDING` | 4 Task |
| **Fase 6** | Global Error Boundary, 404 Not Found, & Fallback UI | `PENDING` | 3 Task |
| **Fase 7** | Sinkronisasi Kamus Lokalisasi Dwi-Bahasa (ID/EN) & Audit TypeScript | `PENDING` | 3 Task |

---

## 🔍 Ringkasan Temuan Audit Codebase (Baseline Audit Findings)

Berdasarkan pemindaian menyeluruh di seluruh direktori `src/`:
1. **50 Pemanggilan `alert()` dan `confirm()` Browser:** Ditemukan 50 titik pemanggilan `window.alert()` dan `window.confirm()` di 18 file komponen yang memblokir UI thread dan merusak konsistensi desain platform (misal pada upload gambar, booking checkout, pembatalan, dan aksi admin).
2. **Ketiadaan Sistem Toast Terpusat:** Proyek saat ini belum memiliki Toast Notification provider bawaan yang dapat dipanggil secara deklaratif melalui hook `useToast()`.
3. **Double-Click & Tombol Tanpa Spinner:** Sejumlah form mutasi data penting (seperti transfer penarikan payout host, checkout reservasi, approval admin, dan simpan profil) belum memiliki spinner visual (`Loader2 animate-spin`) serta proteksi penonaktifan tombol yang ketat saat proses asinkron berjalan.
4. **Alur Midtrans Menggantung pada `onClose`:** Pada `BookingClient.tsx` dan `CheckoutClient.tsx`, callback `onClose` dan `onPending` belum memiliki penanganan yang mengembalikan state tombol atau memberikan arahan jelas kepada tamu yang menutup modal sebelum membayar.
5. **Celah Input Tanggal Manual & Validasi Upload:** Fungsi `handleManualInput` di `BookingDateInputs.tsx` memungkinkan pengguna mengetik tanggal lampau atau tanggal terblokir tanpa validasi instan di sisi klien. Pesan validasi upload 5MB dan MIME type masih mengandalkan `alert()`.
6. **Empty States Sangat Minimalis & Tanpa Tombol Aksi:** Tab admin hanya menampilkan teks 1 baris abu-abu tanpa ikon atau tombol reset; `UsersDirectoryTab.tsx` bahkan tidak memiliki pengecekan empty state sama sekali; pencarian properti di homepage tidak menyediakan tombol reset filter.
7. **Absennya Error Boundary & Halaman 404:** Belum tersedia file `not-found.tsx`, `error.tsx`, maupun `global-error.tsx` di `src/app/` dan `/properties/[id]`, sehingga error runtime atau URL tidak valid menghasilkan halaman default unstyled bawaan framework.

---

## 🔔 Fase 1: Sistem Toast Notification Terpusat & Eliminasi `alert()` / `confirm()`

### Tujuan:
Membangun infrastruktur notifikasi modern berbasis Toast yang ringan, responsif, dan elegan (mendukung varian `success`, `error`, `warning`, `info`), serta mengganti seluruh `window.alert()` dan `window.confirm()` dengan komponen UI ramah pengguna.

### File Terkait:
- `src/components/ui/toast.tsx` & `src/components/ui/use-toast.ts` (Komponen baru)
- `src/components/ui/ConfirmDialog.tsx` (Komponen modal konfirmasi baru)
- `src/app/layout.tsx` (Injeksi Provider)
- 18 file komponen yang teridentifikasi menggunakan `alert()` / `confirm()`

### Checklist Task:
- [x] **Task 1.1: Bangun Sistem Toast Terpusat (`ToastProvider` & Hook `useToast`)**
  - Buat komponen `Toast` berbasis Tailwind CSS dengan animasi halus (`animate-in fade-in slide-in-from-top-2`), durasi auto-dismiss (default 4 detik), tombol tutup (X), dan dukungan mode gelap/terang.
  - Sediakan hook `useToast()` dengan metode `toast({ title, description, variant: 'default' | 'success' | 'destructive' | 'warning' | 'info' })`.
  - Pasang `<ToastProvider />` di dalam `src/app/layout.tsx`.
- [x] **Task 1.2: Bangun Komponen Modal Konfirmasi Terpadu (`ConfirmDialog`)**
  - Buat komponen dialog konfirmasi deklaratif untuk menggantikan seluruh `window.confirm()`.
  - Dukung judul, deskripsi risiko/konsekuensi, tombol Batal, tombol Konfirmasi (dengan warna disesuaikan: destruktif rose-600 atau primer), serta status loading saat konfirmasi diproses.
- [x] **Task 1.3: Bersihkan Pemanggilan `alert()` pada Seluruh Form Pengguna & Host**
  - Ganti `alert()` dengan `toast({ variant: "destructive" | "success" })` pada:
    - `src/components/ImageUpload.tsx`
    - `src/components/properties/PropertyForm.tsx`
    - `src/components/bookings/ReportDisputeModal.tsx`
    - `src/app/properties/[id]/BookingClient.tsx`
    - `src/app/checkout/[id]/CheckoutClient.tsx`
    - `src/app/profile/components/ProfileHeader.tsx`
    - `src/app/profile/components/tabs/personal/PersonalPhotoCard.tsx`
    - `src/app/profile/components/tabs/personal/PersonalInfoTab.tsx`
    - `src/app/profile/components/tabs/PrivacyTab.tsx`
    - `src/app/profile/components/tabs/NotificationsTab.tsx`
    - `src/app/profile/components/tabs/PreferencesTab.tsx`
    - `src/app/profile/components/dialogs/DeactivateAccountModal.tsx`
    - `src/app/dashboard/components/tabs/HostBankAccountForm.tsx`
    - `src/app/dashboard/components/dialogs/BlockDateDialog.tsx`
    - `src/app/dashboard/HostBookingActions.tsx`
    - `src/app/dashboard/ReviewModal.tsx`
    - `src/app/dashboard/utils/exportCsv.ts`
- [x] **Task 1.4: Bersihkan Pemanggilan `alert()` dan `confirm()` pada Panel Admin**
  - Ganti seluruh dialog konfirmasi kaku dan alert error pada panel admin:
    - `src/app/admin/components/tabs/UsersDirectoryTab.tsx` (Konfirmasi ubah role user)
    - `src/app/admin/components/tabs/SystemSettingsTab.tsx` (Konfirmasi reset setting sistem)
    - `src/app/admin/components/tabs/KycAuditTab.tsx`, `PayoutsTab.tsx`, `DisputesTab.tsx`, `RefundsTab.tsx`
    - `src/app/admin/components/dialogs/RefundConfirmDialog.tsx`
    - `src/app/dashboard/components/tabs/AvailabilityTab.tsx` (Konfirmasi buka blokir tanggal)

---

## ⏳ Fase 2: Standarisasi Loading State & Proteksi Anti Double-Click

### Tujuan:
Mencegah terjadinya eksekusi ganda (*race condition* di sisi klien) saat pengguna mengklik tombol aksi asinkron secara berulang, serta memberikan umpan balik visual (*loading spinner* & teks proses) yang jelas pada seluruh alur mutasi.

### File Terkait:
- `src/app/properties/[id]/components/BookingConfirmDialog.tsx`
- `src/app/properties/[id]/BookingClient.tsx`
- `src/app/dashboard/components/dialogs/WithdrawConfirmDialog.tsx`
- `src/app/dashboard/components/tabs/HostPayoutsTab.tsx`
- `src/app/admin/components/dialogs/DisputeResolutionDialog.tsx`
- `src/app/admin/components/dialogs/RefundConfirmDialog.tsx`
- `src/app/admin/components/dialogs/PayoutConfirmDialog.tsx`
- `src/app/admin/components/dialogs/KycRejectDialog.tsx`
- `src/components/properties/PropertyFormActions.tsx`

### Checklist Task:
- [ ] **Task 2.1: Proteksi Anti Double-Click & Spinner pada Alur Checkout Reservasi**
  - Pada `BookingConfirmDialog.tsx` dan `BookingClient.tsx`, tampilkan animasi `<Loader2 className="w-4 h-4 animate-spin" />` di samping teks proses saat `loading: true`.
  - Pastikan tombol terkunci (*disabled*) dan cursor berubah menjadi `cursor-not-allowed` selama proses inisiasi token pembayaran Midtrans berlangsung.
- [ ] **Task 2.2: Standarisasi Loading Indikator pada Dialog Penarikan Saldo Host**
  - Pada `WithdrawConfirmDialog.tsx`, sembunyikan ikon `<CheckCircle2 />` dan tampilkan `<Loader2 className="w-4 h-4 animate-spin" />` saat `loading: true`.
  - Kunci tombol Batal dan tombol Konfirmasi agar host tidak dapat menutup atau mengirim ulang request mutasi saat transfer sedang dikirim ke `/api/host/payouts`.
- [ ] **Task 2.3: Standarisasi Loading & Disable Form pada Modal Putusan Admin**
  - Pada `DisputeResolutionDialog.tsx`, `RefundConfirmDialog.tsx`, `PayoutConfirmDialog.tsx`, dan `KycRejectDialog.tsx`:
    - Tampilkan spinner `<Loader2 className="w-4 h-4 animate-spin" />` pada tombol putusan utama.
    - Nonaktifkan (*disable*) seluruh elemen form (radio button alokasi dana, textarea catatan, input nomor referensi transfer) saat `loading: true` agar admin tidak mengubah data saat proses submit.
- [ ] **Task 2.4: Proteksi Loading pada Form Properti, Profil, & Aksi Reservasi**
  - Di `PropertyFormActions.tsx`, tambahkan animasi spinner pada tombol Terbitkan / Simpan Properti (`loading`) dan Hapus Properti (`deleting`).
  - Di `HostBookingActions.tsx` dan `GuestTripActions.tsx`, pasang `<RotateCw className="w-4 h-4 animate-spin" />` pada tombol verifikasi status pembayaran manual.

---

## 💳 Fase 3: Pengerasan Edge Cases Alur Pembayaran Midtrans Snap

### Tujuan:
Menangani seluruh skenario ekstrem pada siklus pembayaran Midtrans (tamu menutup popup sebelum bayar, pembayaran pending via Virtual Account/QRIS, atau kegagalan jaringan), memastikan state tidak menggantung, dan memberikan instruksi langkah berikutnya yang transparan.

### File Terkait:
- `src/app/properties/[id]/BookingClient.tsx`
- `src/app/checkout/[id]/CheckoutClient.tsx`
- `src/app/checkout/[id]/page.tsx`

### Checklist Task:
- [ ] **Task 3.1: Penanganan Event `onClose` pada Midtrans Snap (Anti-Hanging)**
  - Pada `CheckoutClient.tsx` (dan pop-up handler jika dipanggil di sisi klien), implementasikan callback `onClose: function ()`.
  - Jika pengguna menutup pop-up/iframe sebelum menyelesaikan transaksi:
    - Segera reset status loading pada tombol.
    - Munculkan toast notifikasi informasi: *"Pembayaran belum diselesaikan. Anda dapat melanjutkan pembayaran dalam 60 menit melalui halaman ini atau menu Perjalanan Saya di Dasbor."*
    - Jangan biarkan tombol atau layar berada dalam status terkunci.
- [ ] **Task 3.2: Penanganan Status `onPending` (Instruksi Pembayaran Tertunda)**
  - Pada callback `onPending`, berikan pesan panduan yang jelas: *"Pesanan Anda tersimpan. Silakan selesaikan pembayaran sesuai petunjuk metode yang dipilih sebelum batas waktu berakhir."*
  - Arahkan tamu ke tab Perjalanan Saya (`/dashboard?tab=trips`) dengan penanda visual status "Menunggu Pembayaran" (*Pending*).
- [ ] **Task 3.3: Penanganan Status `onError` & Sinkronisasi Pembayaran**
  - Ganti `alert(t.paymentFailed)` pada callback `onError` dengan dialog atau toast error yang informatif beserta tombol opsi "Coba Metode Pembayaran Lain".
  - Sediakan tombol manual "Cek Status Pembayaran" jika tamu merasa sudah membayar di aplikasi bank namun status belum terbarui secara otomatis.

---

## 📋 Fase 4: Sinkronisasi Validasi Sisi Klien (Upload Berkas & Seleksi Kalender)

### Tujuan:
Menyelaraskan validasi form sisi klien dengan pengerasan backend (Fase 8 & Fase 3), mencegah pengiriman payload yang pasti akan ditolak server, serta mencegah pemilihan tanggal masa lalu atau tanggal kamar yang tidak tersedia.

### File Terkait:
- `src/components/ImageUpload.tsx`
- `src/components/KycModal.tsx`
- `src/app/admin/components/dialogs/RefundConfirmDialog.tsx`
- `src/app/profile/components/ProfileHeader.tsx`
- `src/app/profile/components/tabs/personal/PersonalPhotoCard.tsx`
- `src/app/properties/[id]/components/BookingDateInputs.tsx`
- `src/app/dashboard/components/dialogs/BlockDateDialog.tsx`

### Checklist Task:
- [ ] **Task 4.1: Validasi Pre-Upload Ukuran & MIME Type Seragam (Client-Side Guard)**
  - Standarisasi fungsi helper validasi upload berkas: hanya menerima MIME `image/jpeg`, `image/png`, `image/webp`, dan ukuran maksimal 5 MB (5 * 1024 * 1024 bytes).
  - Terapkan helper pada `ImageUpload.tsx`, `KycModal.tsx`, `RefundConfirmDialog.tsx`, `ProfileHeader.tsx`, dan `PersonalPhotoCard.tsx`.
  - Tolak file tidak valid langsung di peramban dengan pesan toast deskriptif sebelum memanggil `fetch('/api/upload')`, menghemat kuota transmisi jaringan dan resource server.
- [ ] **Task 4.2: Validasi Anti-Past Date & Disabled Dates pada Input Tanggal Manual**
  - Pada `BookingDateInputs.tsx` (`handleManualInput`), validasi tanggal yang diketik manual pengguna:
    - Jika `iso < todayStr` (tanggal sebelum hari ini dalam WIB), tolak input dan tampilkan toast *"Tanggal check-in tidak boleh berada di masa lalu"*.
    - Jika `iso` berada dalam daftar `disabledDatesList` (kamar sudah terpesan/diblokir), tolak input dan beri tahu pengguna bahwa tanggal tersebut tidak tersedia.
- [ ] **Task 4.3: Validasi Preventif Bentrok Reservasi pada Dialog Blokir Tanggal Host**
  - Pada `BlockDateDialog.tsx`, pastikan pemilihan tanggal mulai dan selesai memvalidasi bahwa `startDate >= hari ini` dan `endDate > startDate`.
  - Berikan feedback langsung di formulir jika tanggal yang dipilih tidak logis sebelum host mengirimkan formulir ke server.

---

## 📭 Fase 5: Komponen Empty States Komprehensif & Aksi Reset Filter

### Tujuan:
Menghilangkan tampilan kosong tanpa arah pada seluruh tabel dan daftar data. Menyediakan komponen `<EmptyState />` terpadu yang memuat ilustrasi/ikon relevan, pesan informatif, dan tombol aksi (*Call to Action*) yang membantu pengguna melanjutkan navigasi (seperti "Reset Filter", "Jelajahi Properti", atau "Tambah Properti").

### File Terkait:
- `src/components/ui/EmptyState.tsx` (Komponen baru)
- `src/components/ExploreView.tsx` (Hasil Pencarian Properti)
- `src/app/dashboard/components/tabs/PropertiesTab.tsx`
- `src/app/dashboard/components/tabs/HostBookingsTab.tsx`
- `src/app/dashboard/components/tabs/PayoutHistoryTable.tsx`
- `src/app/dashboard/components/tabs/AvailabilityTab.tsx`
- `src/app/admin/components/tabs/KycAuditTab.tsx`
- `src/app/admin/components/tabs/DisputesTab.tsx`
- `src/app/admin/components/tabs/RefundsTab.tsx`
- `src/app/admin/components/tabs/BookingsTab.tsx`
- `src/app/admin/components/tabs/PayoutsTab.tsx`
- `src/app/admin/components/tabs/UsersDirectoryTab.tsx`

### Checklist Task:
- [ ] **Task 5.1: Bangun Komponen Terpadu `<EmptyState />`**
  - Buat komponen modular dengan properti: `icon`, `title`, `description`, `actionLabel`, `onAction` / `actionHref`, dan `secondaryActionLabel` opsional.
  - Beri styling modern dengan rounded card, border dashed, background lembut di dark/light mode, dan tipografi rapi.
- [ ] **Task 5.2: Terapkan Empty State & Tombol Reset pada Halaman Pencarian Properti**
  - Pada `ExploreView.tsx`: jika `properties.length === 0`, tampilkan empty state dengan tombol *"Hapus Filter & Tampilkan Semua"* yang mereset query string dan mengarahkan pengguna kembali ke URL kanonikal `/`.
- [ ] **Task 5.3: Terapkan Empty State pada Seluruh Tab Host Dashboard**
  - Di `PropertiesTab.tsx`: bedakan antara user yang memang belum memiliki listing (CTA: *"Tambah Properti Baru"*) dengan user yang hasil pencarian/filternya nihil (CTA: *"Reset Filter"*).
  - Di `HostBookingsTab.tsx`: tambahkan tombol aksi reset filter jika tidak ada reservasi yang cocok dengan status yang dipilih.
  - Di `PayoutHistoryTable.tsx`: tampilkan informasi alur pencairan dana dan waktu rilis escrow jika belum ada riwayat penarikan.
  - Di `AvailabilityTab.tsx`: berikan panduan informatif jika belum ada tanggal yang diblokir oleh host.
- [ ] **Task 5.4: Terapkan Empty State Terstandar pada Seluruh Tab Admin Dashboard**
  - Ganti teks statis abu-abu 1 baris di `KycAuditTab.tsx`, `DisputesTab.tsx`, `RefundsTab.tsx`, `BookingsTab.tsx`, dan `PayoutsTab.tsx` dengan komponen `<EmptyState />` berikon Lucide yang selaras (`ShieldCheck`, `Scale`, `Banknote`, `CalendarDays`, `Landmark`).
  - Tambahkan penanganan empty state pada `UsersDirectoryTab.tsx` yang sebelumnya sama sekali tidak memiliki pengecekan `filteredUsers.length === 0`.

---

## 🛑 Fase 6: Global Error Boundary, 404 Not Found, & Fallback UI

### Tujuan:
Menyediakan pengalaman navigasi yang tangguh (*graceful failure*) ketika terjadi error runtime di sisi server/klien atau ketika pengguna mengakses URL yang tidak terdaftar/properti yang telah dihapus.

### File Terkait:
- `src/app/not-found.tsx` (Baru)
- `src/app/error.tsx` (Baru)
- `src/app/global-error.tsx` (Baru)
- `src/app/properties/[id]/not-found.tsx` (Baru)
- `src/app/properties/[id]/error.tsx` (Baru)

### Checklist Task:
- [ ] **Task 6.1: Bangun Halaman Global 404 Not Found (`src/app/not-found.tsx`)**
  - Buat halaman 404 modern berkarakter Ruang Rehat dengan ilustrasi/ikon menarik, pesan bahwa halaman atau penginapan tidak ditemukan, serta tombol navigasi utama *"Kembali ke Beranda"* dan *"Jelajahi Properti"*.
- [ ] **Task 6.2: Bangun Global Error Boundary (`src/app/error.tsx` & `src/app/global-error.tsx`)**
  - Buat komponen penangkap error runtime (`"use client"`) yang menerima prop `{ error, reset }`.
  - Tampilkan pesan bahwa sistem mengalami kendala teknis sementara (tanpa mengekspos stack trace internal ke pengguna umum), tombol *"Coba Lagi"* (`reset()`), serta tombol bantuan *"Kembali ke Beranda"*.
- [ ] **Task 6.3: Bangun Contextual Error & Not Found untuk Detail Properti (`/properties/[id]`)**
  - Buat `src/app/properties/[id]/not-found.tsx` khusus untuk menangani skenario ID penginapan yang tidak valid atau telah dihapus oleh host.
  - Sediakan tombol pintas bagi tamu untuk mencari penginapan serupa di destinasi populer.

---

## 🌐 Fase 7: Sinkronisasi Kamus Lokalisasi (Dwi-Bahasa ID/EN) & Audit TypeScript

### Tujuan:
Memastikan seluruh teks pesan error baru, string notifikasi toast, label tombol empty states, dan teks fallback error boundary terdaftar secara lengkap dan simetris di kedua kamus bahasa (`src/lib/dictionaries/id.ts` dan `en.ts`), mempertahankan **0 error TypeScript (`npx tsc --noEmit`)**.

### File Terkait:
- `src/lib/dictionaries/id.ts`
- `src/lib/dictionaries/en.ts`
- Seluruh komponen yang mengonsumsi dictionary

### Checklist Task:
- [ ] **Task 7.1: Inventarisasi & Penambahan Key Kamus Baru ke `id.ts`**
  - Daftarkan key kamus baru untuk:
    - Pesan Toast (sukses update data, gagal upload berkas, format tidak didukung, ukuran melebihi batas).
    - Status loading aksi (memproses reservasi, memproses transfer, menghapus listing).
    - Empty states (judul, deskripsi, dan label CTA reset filter untuk seluruh modul).
    - Halaman 404 dan Error boundary.
- [ ] **Task 7.2: Sinkronisasi Penuh ke `en.ts` (Zero Undefined Translation)**
  - Salin dan terjemahkan seluruh key baru ke `src/lib/dictionaries/en.ts` dengan padanan bahasa Inggris yang natural dan profesional.
  - Pastikan tipe `Dictionary` tetap valid dan tidak ada properti opsional yang memicu nilai `undefined` saat bahasa diubah ke bahasa Inggris.
- [ ] **Task 7.3: Verifikasi Kompilasi & Validasi Akhir (`npx tsc --noEmit`)**
  - Jalankan `npx tsc --noEmit` untuk memverifikasi integritas tipe data TypeScript pada seluruh komponen yang diperbarui.
  - Konfirmasi tidak ada kebocoran tipe `any` atau peringatan kompilasi pada antarmuka frontend.

---

## 🔒 Aturan Eksekusi
1. Setiap perubahan komponen dilakukan secara bertahap per fase.
2. Setiap kali menyelesaikan sebuah fase, jalankan `npx tsc --noEmit` untuk memastikan 0 error kompilasi sebelum melanjutkan ke fase berikutnya.
3. Seluruh commit git menggunakan format *Conventional Commits* (misal: `feat(ui): add centralized toast notification and confirm dialog system`).
