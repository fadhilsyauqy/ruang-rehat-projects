# Tinjauan Arsitektur Profesional & Panduan Eksekusi Refactoring (Ruang Rehat)

Dokumen ini berisi evaluasi tingkat *Senior Architect* terhadap berkas `REFACTORING_PLAN.md` yang dihasilkan oleh OpenCode, mengidentifikasi celah tersembunyi (*blind spots*) yang perlu diwaspadai, serta memberikan instruksi eksekusi langkah demi langkah agar proses pemecahan berkas berjalan dengan **0% regresi (tanpa merusak fitur yang sudah jalan)**.

---

## 1. Evaluasi Hasil Analisis OpenCode (Apa yang Sudah Tepat?)

Secara keseluruhan, `REFACTORING_PLAN.md` yang dihasilkan oleh OpenCode memiliki kualitas pemetaan **9/10 (Sangat Baik)**. Beberapa poin yang sangat tepat dari rencana tersebut:

1. **Deteksi *Zero Cross-Imports* (Isolasi Daun):** OpenCode berhasil mendeteksi bahwa berkas-berkas raksasa tersebut tidak saling mengimpor satu sama lain. Ini adalah kabar yang sangat bagus karena kamu bisa memecah satu halaman tanpa takut halaman lain ikut error.
2. **Urutan Prioritas Berbasis Risiko:** Memulai dari `AddPropertyClient` & `EditPropertyClient` (500-an baris) sebelum menyentuh monster `ProfileClient` (3.638 baris) adalah strategi yang sangat tepat untuk "pemanasan" dan menguji konsistensi AI.
3. **Identifikasi *Shared Logic* yang Tajam:** Penemuan duplikasi pada `DualMonthCalendar`, `PropertyForm`, dan rumus konversi kurs IDR/USD akan memangkas lebih dari **1.500+ baris kode duplikat** secara instan.

---

## 2. Temuan Kritis & "Red Flags" yang Harus Diperbaiki (Saran Profesional)

Sebagai peninjau teknis profesional, ada **5 celah arsitektur dan bisnis** di dalam laporan tersebut yang tidak disadari oleh OpenCode dan **wajib** kamu koreksi saat mengeksekusi refactoring:

### 🚨 Red Flag #1: Hardcoded Kurs `18051` dan Persentase Fee `0.97` di Frontend
Pada Bagian 3.3 di laporanmu, tertulis kode seperti ini:
```typescript
b.totalPriceIdr || (b.totalPrice ? Math.round(b.totalPrice * 18051) : 0)
curr.netHostPayoutIdr || (curr.totalPriceIdr ? Math.round(curr.totalPriceIdr * 0.97) : ...)
```
* **Masalah Profesional:** Di bagian `AdminDashboardClient` disebutkan ada fitur *SystemSettingsTab* (konfigurasi kurs & split fee). Jika angka `18051` dan `0.97` dipatenkan (*hardcoded*) di dalam fungsi *helper* statis, maka saat Admin mengubah kurs atau komisi di pengaturan sistem, perhitungan di dasbor tidak akan ikut berubah!
* **Solusi:** Saat mengekstrak ke `src/lib/format.ts`, jadikan nilai kurs dan persentase fee sebagai **parameter dinamis dengan nilai default** (misal: `exchangeRate = 18051`, `hostFeeMultiplier = 0.97`) serta definisikan konstanta default-nya di `src/lib/constants.ts`, bukan angka ajaib (*magic numbers*) di tengah rumus.

### 🚨 Red Flag #2: Jebakan `src/types/index.ts` (Barrel File Anti-Pattern)
OpenCode menyarankan memusatkan semua tipe data di satu file `src/types/index.ts`.
* **Masalah Profesional:** Jika semua tipe untuk Profile, Admin, Host, Booking, dan KYC digabung di satu file `index.ts`, dalam waktu singkat file itu akan membengkak menjadi 800+ baris baru.
* **Solusi:** Pecah berdasarkan domain sejak awal di dalam folder `src/types/`:
  - `src/types/booking.types.ts`
  - `src/types/property.types.ts`
  - `src/types/user-kyc.types.ts`
  - `src/types/finance.types.ts` (Payout, Refund, Dispute)
  - Gunakan **Prisma Generated Types** (`Prisma.BookingGetPayload<{ include: ... }>`) agar tipe data di Frontend selalu sinkron otomatis dengan skema database Prisma-mu, bukan menulis `interface` manual dari nol.

### 🚨 Red Flag #3: Bahaya "Prop Drilling" Saat Memecah 8 Tab Admin & 7 Tab Profile
Ketika `AdminDashboardClient.tsx` (2.773 baris) dipecah menjadi 8 tab dan 4 dialog modal, biasanya terdapat puluhan `useState` di file induk.
* **Masalah Profesional:** Jika AI hanya memindahkan kode JSX (tampilan) ke `KycAuditTab.tsx`, tapi semua `useState` tetap menumpuk di `AdminDashboardClient.tsx`, maka file induk akan tetap gemuk dan kamu harus mengirim 15–20 *props* ke setiap tab (*Prop Drilling*).
* **Solusi (State Colocation):** Perintahkan OpenCode bahwa **state lokal milik suatu tab (seperti filter tabel KYC, search query di tab Users, atau state form di tab Profile) WAJIB ikut pindah ke dalam komponen tab masing-masing**, bukan ditinggal di komponen induk.

### 🚨 Red Flag #4: Optimasi Performa dengan `next/dynamic` (Lazy Loading Tab)
Saat ini, ketika pengguna membuka `/profile` atau `/admin`, browser mengunduh kode JavaScript untuk **semua 7-8 tab sekaligus**, padahal pengguna hanya melihat 1 tab pertama.
* **Solusi:** Saat memecah tab di Milestone 5, 6, dan 7, gunakan `dynamic(() => import('./components/tabs/...'))` atau pastikan tab yang tidak aktif di-*unmount* dengan bersih agar beban memori browser turun drastis dan halaman terbuka jauh lebih cepat.

### 🚨 Red Flag #5: Kamus Bahasa (`dictionary.ts`) Masih > 300 Baris per File
Dalam rencana OpenCode, `id.ts` dan `en.ts` masing-masing diestimasi sekitar ~340 baris.
* **Solusi:** Itu sudah cukup aman untuk tahap ini, tetapi pastikan struktur objek di `en.ts` menggunakan `typeof id` dari TypeScript. Dengan begitu, jika ada 1 kata saja yang lupa diterjemahkan di bahasa Inggris, TypeScript akan langsung memberikan peringatan *error*.

---

## 3. Protokol Eksekusi Profesional (Wajib Diikuti)

Jangan pernah mengeksekusi Milestone 1 sampai 7 dalam satu sesi obrolan! Ikuti **Siklus 4 Langkah** ini untuk setiap Milestone:

1. **Satu Milestone = Satu Sesi Konteks:** Setelah satu Milestone selesai, gunakan perintah `/compact` atau buat sesi *chat* baru di OpenCode agar memori AI tetap tajam.
2. **Verifikasi Kompilasi (`npx tsc --noEmit`):** Setiap selesai 1 Milestone, wajib jalankan pengecekan TypeScript. Jangan lanjut ke Milestone berikutnya jika masih ada 1 *error* pun.
3. **Checkpoint Git Commit:** Lakukan `git add . && git commit -m "refactor(milestone-X): deskripsi"` setiap kali satu Milestone sukses. Ini adalah jaring pengamanmu jika AI melakukan kesalahan di tahap berikutnya.
4. **Hapus State Induk yang Menganggur:** Pastikan setiap kali sebuah Tab/Modal dipindahkan ke file baru, state dan fungsi handler-nya di file lama benar-benar dihapus.

---

## 4. Kumpulan Prompt Eksekusi Siap Pakai (Per Milestone)

Gunakan *prompt* di bawah ini secara berurutan di OpenCode karena sudah dilengkapi dengan **aturan pengaman profesional** untuk mengatasi 5 *Red Flags* di atas.

### 📌 Prompt Milestone 1: Shared Utilities, Dynamic Rates & Domain Types
> *"Berdasarkan `@REFACTORING_PLAN.md`, mari eksekusi **Milestone 1 (Shared Utilities, Badges & Types)** dengan penyempurnaan arsitektur berikut:*
> *1. **Domain Types (`src/types/`):** Jangan tumpuk di satu file. Buat file terpisah (`booking.types.ts`, `property.types.ts`, `admin.types.ts`) dan gunakan `Prisma.ModelGetPayload` jika memungkinkan untuk menggantikan tipe `any[]` yang ada di dashboard dan admin.*
> *2. **Helper Kalkulasi & Formatter (`src/lib/format.ts`):** Ekstrak `getBookingPriceIdr`, `getBookingHostPayoutIdr`, dan `formatNumberInput`. PENTING: Untuk angka kurs fallback (`18051`) dan rasio fee (`0.97`), simpan sebagai konstanta default di `src/lib/constants.ts` dan jadikan sebagai optional parameter di fungsi helper agar tidak menjadi magic numbers yang kaku.*
> *3. **Reusable Badges:** Buat `BookingStatusBadge.tsx` dan `KycStatusBadge.tsx` di `src/components/ui/`.*
> 
> *Catatan: Di tahap ini, buat file-file shared tersebut terlebih dahulu dan pastikan `npx tsc --noEmit` menghasilkan 0 error."*

### 📌 Prompt Milestone 2: Penyatuan Formulir Properti (`Add` & `Edit`)
> *"Mari lanjut ke **Milestone 2** sesuai `@REFACTORING_PLAN.md`: menyatukan `@src/app/properties/new/AddPropertyClient.tsx` dan `@src/app/properties/[id]/edit/EditPropertyClient.tsx`.*
> *1. Buat modul bersama di `src/components/properties/` (`PropertyForm.tsx`, `PropertyLocationSection.tsx`, `PropertyPricingSection.tsx`, `PropertyAmenitiesSection.tsx`) dengan batas maksimal 250 baris per file.*
> *2. Pastikan `PropertyForm` menerima prop `mode: 'create' | 'edit'` dan `initialData` dengan strict TypeScript (tanpa `any`).*
> *3. Refactor `AddPropertyClient.tsx` dan `EditPropertyClient.tsx` agar hanya menjadi wrapper tipis (~40-50 baris) yang memanggil `PropertyForm`.*
> *4. Pastikan semua fitur (kalkulasi USD, koordinat peta, fasilitas, upload gambar, dan submit ke server action) berjalan 100% identik tanpa error TypeScript."*

### 📌 Prompt Milestone 3: Pemisahan Kamus Bahasa (`dictionaries`)
> *"Eksekusi **Milestone 3** sesuai `@REFACTORING_PLAN.md`:*
> *1. Pecah `@src/lib/dictionary.ts` ke dalam folder `src/lib/dictionaries/` (`id.ts`, `en.ts`, dan `index.ts`).*
> *2. PENTING: Gunakan tipe dari `id.ts` (`export type Dictionary = typeof id`) sebagai kontrak tipe pada `en.ts` agar kedua bahasa dijamin memiliki key yang 100% sinkron.*
> *3. Pastikan export di `src/lib/dictionary.ts` (atau update import di seluruh proyek) tetap kompatibel agar tidak ada komponen yang rusak. Cek dengan ` tsc --noEmit`."*

### 📌 Prompt Milestone 4: Ekstraksi Kalender 2 Bulan & Guest Counter
> *"Eksekusi **Milestone 4** sesuai `@REFACTORING_PLAN.md`:*
> *1. Ekstrak logika kalender dua bulan dan pemilih tamu yang terduplikasi ke `src/components/calendar/DualMonthCalendar.tsx`, `GuestCounterDropdown.tsx`, dan `DestinationSuggestions.tsx`.*
> *2. Perhatikan perbedaan kebutuhan antara `@src/app/properties/[id]/BookingClient.tsx` (yang mungkin memiliki pengecekan tanggal yang sudah di-block/dibooking) dan `@src/components/SearchFilterBar.tsx`. Buat props yang fleksibel pada `DualMonthCalendar` untuk mengakomodasi keduanya.*
> *3. Ganti kode lama di `BookingClient.tsx` dan `SearchFilterBar.tsx` dengan komponen baru tersebut hingga ukuran keduanya turun di bawah 230 baris. Pastikan 0 error TypeScript."*

### 📌 Prompt Milestone 5: Modularisasi `HostDashboardView.tsx` (2.578 Baris)
> *"Sekarang kita masuk ke **Milestone 5**: Memecah `@src/app/dashboard/HostDashboardView.tsx` (2.578 baris) sesuai struktur di `@REFACTORING_PLAN.md`.*
> 
> *Aturan Arsitektur Wajib:*
> *1. **State Colocation:** Jangan biarkan semua `useState` menumpuk di `HostDashboardView.tsx`. Pindahkan state lokal (seperti filter tabel, input form bank inquiry, state modal withdraw/block date) ke dalam file Tab atau Dialog masing-masing.*
> *2. Gunakan helper `getBookingPriceIdr`, `getBookingHostPayoutIdr`, dan komponen `BookingStatusBadge` yang sudah kita buat di Milestone 1.*
> *3. Lakukan ekstraksi secara bertahap (mulai dari Dialogs, lalu StatsHeader, lalu masing-masing Tab di `src/app/dashboard/components/tabs/`).*
> *4. Pastikan setiap file baru maksimal 250 baris, tidak ada prop `any`, dan verifikasi dengan `tsc --noEmit`."*

### 📌 Prompt Milestone 6: Modularisasi `AdminDashboardClient.tsx` (2.773 Baris)
> *"Sekarang eksekusi **Milestone 6**: Memecah `@src/app/admin/AdminDashboardClient.tsx` (2.773 baris) ke dalam struktur `src/app/admin/components/tabs/` dan `dialogs/` sesuai `@REFACTORING_PLAN.md`.*
> 
> *Aturan Arsitektur Wajib:*
> *1. **State Colocation:** Pindahkan state pencarian, filter, dan form aksi admin ke dalam komponen Tab dan Dialog terkait agar `AdminDashboardClient.tsx` hanya berperan sebagai layout shell dan pengatur tab aktif (~190 baris).*
> *2. Gunakan `BookingStatusBadge`, `KycStatusBadge`, dan helper format mata uang dari Milestone 1.*
> *3. Pastikan interaksi antara Tab (misal `KycAuditTab` atau `DisputesTab`) dengan Dialog (`KycRejectDialog`, `DisputeResolutionDialog`) berjalan mulus tanpa mengubah logika mutasi ke Server Actions.*
> *4. Pastikan 0 error TypeScript setelah selesai."*

### 📌 Prompt Milestone 7: Modularisasi Monster Terakhir `ProfileClient.tsx` (3.638 Baris)
> *"Eksekusi **Milestone 7 (Terakhir)**: Memecah `@src/app/profile/ProfileClient.tsx` (3.638 baris) menjadi 7 komponen Tab terpisah di `src/app/profile/components/tabs/` sesuai `@REFACTORING_PLAN.md`.*
> 
> *Mengingat file ini berinteraksi langsung dengan banyak Server Actions (ubah password, email, UU PDP, notifikasi, NPWP/billing), ikuti aturan ketat ini:*
> *1. **Isolasi State per Tab:** Setiap tab (`PersonalInfoTab`, `SecurityTab`, `PrivacyTab`, `NotificationsTab`, `BusinessBillingTab`, `PreferencesTab`, `HostingSectionTab`) WAJIB mengelola state form, loading state, dan pemanggilan Server Action-nya sendiri. Ini akan menyelesaikan masalah re-render di seluruh halaman saat user mengetik di satu input.*
> *2. Jangan mengubah nama field form, payload Server Action, atau logika validasi sedikit pun.*
> *3. Pastikan setiap file hasil pecahan di bawah 250 baris dan jalankan pemeriksaan penuh `npx tsc --noEmit` di akhir proses."*

---

## 5. Apa yang Harus Dilakukan Setelah Milestone 7 Selesai?

Begitu ketujuh *milestone* di atas tuntas dan semua file berada di bawah 250–300 baris:
1. **Hapus Kode Sampah Sisa Refactoring:** Terkadang setelah memecah file besar, ada *unused imports* yang tertinggal. Minta OpenCode membersihkan *unused imports* di seluruh folder `src/`.
2. **Lanjut ke Tahap 2 (Pemetaan `ARCHITECTURE.md`):** Kini kode proyek **Ruang Rehat** sudah sangat modular dan bersih. Ini adalah saat yang paling sempurna untuk meminta OpenCode membuatkan dokumentasi `ARCHITECTURE.md` (ERD Database & Sequence Diagram Pembayaran/Escrow/Booking).
3. **Lanjut ke Tahap 3 (Audit Keamanan & Escrow):** Karena aplikasi ini memiliki fitur krusial seperti **Escrow, Split-Fee, KYC KTP/NIK (UU PDP), dan Payout Host**, audit keamanan pada logika Server Actions akan menjadi jauh lebih mudah dan akurat setelah kodenya terpisah rapi.