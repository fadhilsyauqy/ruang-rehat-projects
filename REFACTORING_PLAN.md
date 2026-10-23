# Rencana Refaktorisasi & Analisis Berkas Skala Besar (Large Files Audit)

Dokumen ini memuat laporan analisis silang (*cross-analysis*) terhadap berkas-berkas dengan ukuran di atas 500 baris (termasuk file raksasa 2.000–3.600 baris) di dalam repositori **Ruang Rehat**. Dokumen ini menjadi cetak biru panduan arsitektur untuk memecah (*decouple*) kode monolitik menjadi komponen modular berukuran maksimal 250–300 baris tanpa merusak fungsionalitas aplikasi.

---

## 1. Hasil Pemindaian: Berkas Berukuran > 500 Baris

Dari hasil pemindaian menyeluruh di direktori `src/`, teridentifikasi **8 berkas** dengan baris kode melebihi ambang batas 500 baris:

| No | Berkas | Ukuran Saat Ini | Klasifikasi Masalah | Dampak Pemeliharaan (*Maintainability*) |
| :---: | :--- | :---: | :--- | :--- |
| 1 | `src/app/profile/ProfileClient.tsx` | **3.638 baris** | 🚨 **Mega Monolith** | Menyatukan 7 tab besar (Profil pribadi, keamanan, privasi UU PDP, notifikasi, penagihan bisnis, preferensi, hosting) dalam satu komponen raksasa. Re-render terjadi pada seluruh tab saat satu input form berubah. |
| 2 | `src/app/admin/AdminDashboardClient.tsx` | **2.773 baris** | 🚨 **Mega Monolith** | Menampung 8 tab audit operasional (Overview, KYC, Payouts, Sengketa, Refunds, Bookings, Users, Settings) serta 4 dialog modal penentu kebijakan dalam satu file. |
| 3 | `src/app/dashboard/HostDashboardView.tsx` | **2.578 baris** | 🚨 **Mega Monolith** | Menyatukan 5 domain kerja (Manajemen listing, pesanan masuk host, kalender ketersediaan, pencairan dana host, dan riwayat perjalanan tamu) beserta 5 dialog modal. |
| 4 | `src/app/properties/[id]/BookingClient.tsx` | **806 baris** | **Monolith Komponen** | Logika kalender rentang tanggal 2 bulan, pemilih jumlah tamu (*guest counter*), dan kalkulasi harga *split-fee* bercampur dengan tata letak visual. |
| 5 | `src/components/SearchFilterBar.tsx` | **724 baris** | **Monolith Komponen** | Menggabungkan daftar rekomendasi kota Indonesia, kalender 2 bulan kustom, dropdown tamu, dan sinkronisasi URL parameter dalam satu berkas. |
| 6 | `src/lib/dictionary.ts` | **694 baris** | **Data Monolith** | Kamus lokalisasi teks dwi-bahasa (Bahasa Indonesia & English) menumpuk di satu variabel objek raksasa. |
| 7 | `src/app/properties/new/AddPropertyClient.tsx` | **562 baris** | **Formulir Monolith** | Formulir pembuatan properti lengkap yang 90% kodenya identik dengan formulir edit. |
| 8 | `src/app/properties/[id]/edit/EditPropertyClient.tsx` | **534 baris** | **Formulir Monolith** | Formulir pengeditan properti yang menduplikasi hampir seluruh logika dan UI dari `AddPropertyClient`. |

---

## 2. Peta Ketergantungan (*Dependency Map*)

### 2.1 Analisis Impor Silang Antar-Berkas Besar
Berdasarkan penelusuran pohon dependensi (*import graph*):
* **Tidak ada impor silang (*zero cross-imports*)** di antara berkas-berkas komponen besar (`ProfileClient`, `AdminDashboardClient`, `HostDashboardView`, `BookingClient`, `SearchFilterBar`, `AddPropertyClient`, `EditPropertyClient`).
* Masing-masing berkas bertindak sebagai *leaf client component* yang di-import secara eksklusif oleh *Server Page wrapper*-nya masing-masing:
  - `ProfileClient.tsx` hanya di-import oleh `src/app/profile/page.tsx`.
  - `AdminDashboardClient.tsx` hanya di-import oleh `src/app/admin/page.tsx`.
  - `HostDashboardView.tsx` hanya di-import oleh `src/app/dashboard/page.tsx`.
  - `BookingClient.tsx` hanya di-import oleh `src/app/properties/[id]/page.tsx`.
  - `AddPropertyClient.tsx` hanya di-import oleh `src/app/properties/new/page.tsx`.
  - `EditPropertyClient.tsx` hanya di-import oleh `src/app/properties/[id]/edit/page.tsx`.
* **Satu-satunya berkas yang di-import secara luas** adalah `src/lib/dictionary.ts`, karena fungsinya sebagai penyedia teks terjemahan global.

### 2.2 Urutan Keamanan Refaktorisasi (Dari Risiko Terendah ke Tertinggi)

```
[Level 1: Paling Aman / Isolasi Penuh]
  ├── AddPropertyClient.tsx & EditPropertyClient.tsx
  └── dictionary.ts
           ↓
[Level 2: Sedang / Komponen UI Terisolasi]
  └── BookingClient.tsx & SearchFilterBar.tsx
           ↓
[Level 3: Skala Menengah / Monolith Daun Halaman]
  └── HostDashboardView.tsx (Dasbor Host & Tamu)
           ↓
[Level 4: Sangat Kompleks / Banyak State Modal]
  └── AdminDashboardClient.tsx (8 Tab Audit & Governance)
           ↓
[Level 5: Paling Masif / Banyak Server Actions Mutasi]
  └── ProfileClient.tsx (3.638 baris & 7 Tab Profil)
```

1. **Prioritas 1 (Paling Aman): `AddPropertyClient.tsx` & `EditPropertyClient.tsx`**
   - **Tingkat Risiko:** Sangat Rendah.
   - **Alasan:** Kedua file berada di halaman terisolasi (`/properties/new` dan `/properties/[id]/edit`). Duplikasi mencapai 90%. Penggabungan menjadi komponen reusable `PropertyForm` memiliki batas masukan (*props*) yang jelas dan tidak berpotensi mengganggu halaman lain.
2. **Prioritas 2: `dictionary.ts`**
   - **Tingkat Risiko:** Sangat Rendah.
   - **Alasan:** Berkas data statis murni tanpa logika reaktif atau efek samping. Sangat aman dipecah menjadi `dictionaries/id.ts` dan `dictionaries/en.ts`.
3. **Prioritas 3: `BookingClient.tsx` & `SearchFilterBar.tsx`**
   - **Tingkat Risiko:** Rendah - Sedang.
   - **Alasan:** Keduanya menduplikasi logika kalender dua bulan dan *guest counter*. Ekstraksi ke modul `DualMonthCalendar` dan `GuestCounterDropdown` menyederhanakan kedua halaman tanpa mengubah alur data ke backend.
4. **Prioritas 4: `HostDashboardView.tsx` (2.578 baris)**
   - **Tingkat Risiko:** Sedang.
   - **Alasan:** Terisolasi di halaman dasbor. Setiap tab (Properties, Bookings, Availability, Payouts, Trips) mandiri dan dapat dipecah menjadi berkas tab terpisah secara bertahap tanpa mempengaruhi tab lain.
5. **Prioritas 5: `AdminDashboardClient.tsx` (2.773 baris)**
   - **Tingkat Risiko:** Sedang - Tinggi.
   - **Alasan:** Mengelola 8 tab tata kelola dan 4 dialog modal penentu kebijakan (*dispute*, *kyc*, *refund*). Pemecahan membutuhkan pemisahan state dialog dan tabel audit yang cermat.
6. **Prioritas 6: `ProfileClient.tsx` (3.638 baris)**
   - **Tingkat Risiko:** Tinggi (Perlu Kehati-hatian Ekstra).
   - **Alasan:** Berkas paling masif dengan interaksi formulir langsung ke 6 Server Actions di `src/app/actions/preferences.ts` (ganti kata sandi, email, privasi UU PDP, notifikasi, penagihan perusahaan). Refactoring harus dilakukan tab demi tab disertai verifikasi mutasi data.

---

## 3. Shared Logic & Duplikasi Kode yang Teridentifikasi

Berdasarkan analisis silang mendalam, ditemukan duplikasi logika dan antarmuka di beberapa bagian penting:

### 3.1 Duplikasi Formulir Properti (~1.050 Baris Duplikat)
* **Lokasi:** `AddPropertyClient.tsx` (562 baris) dan `EditPropertyClient.tsx` (534 baris).
* **Bagian yang Diduplikasi:**
  - Pilihan kategori properti (VILLA, APARTMENT, HOUSE, HOTEL).
  - Input alamat, judul, deskripsi, dan koordinat Latitude/Longitude.
  - Input harga IDR dengan kalkulasi estimasi USD real-time (`handleCurrencySwitch`).
  - Input biaya kebersihan (*cleaning fee*) dan aturan durasi menginap.
  - Radio button kebijakan pembatalan (FLEXIBLE, MODERATE, STRICT).
  - Checkbox pemilihan fasilitas (`toggleAmenity` dari `ALL_AMENITIES`).
  - Pengelolaan array foto dengan `ImageUpload`.
* **Solusi Arsitektur:** Ekstraksi ke satu komponen tunggal:  
  `src/components/properties/PropertyForm.tsx` yang menerima prop `mode: "create" | "edit"`.

### 3.2 Duplikasi Kalender Dua Bulan & Dropdown Pemilih Tamu
* **Lokasi:** `BookingClient.tsx` dan `SearchFilterBar.tsx`.
* **Fungsi & State yang Diduplikasi:**
  - `nextMonth` & `prevMonth`: Navigasi melompat ke bulan berikutnya/sebelumnya.
  - `formatDateString(date)`: Helper konversi tanggal lokal ke string `YYYY-MM-DD`.
  - `handleDateClick(date)`: Algoritma seleksi rentang tanggal (Check-in s/d Check-out).
  - `renderCalendarMonth(...)`: Render elemen grid tanggal dan visual *in-range*.
  - Logika popover tamu: State dan handler counter `adults`, `childrenCount`, dan `infants` terhadap batasan `maxGuests`.
* **Solusi Arsitektur:** Ekstraksi ke dua komponen bersama:  
  `src/components/calendar/DualMonthCalendar.tsx` dan `src/components/calendar/GuestCounterDropdown.tsx`.

### 3.3 Duplikasi Formula Konversi Transaksi IDR (Fallback Legacy USD)
* **Lokasi:** `AdminDashboardClient.tsx` dan `HostDashboardView.tsx`.
* **Bentuk Duplikasi:** Rumus fallback dari data legacy USD ke IDR ditulis ulang berulang kali:
  ```typescript
  // Duplikasi 1: Menghitung total nilai booking
  b.totalPriceIdr || (b.totalPrice ? Math.round(b.totalPrice * 18051) : 0)

  // Duplikasi 2: Menghitung net host payout
  curr.netHostPayoutIdr || (curr.totalPriceIdr ? Math.round(curr.totalPriceIdr * 0.97) : Math.round((curr.totalPrice || 0) * 18051))
  ```
* **Solusi Arsitektur:** Pindahkan ke helper fungsi tunggal terpusat di `src/lib/format.ts`:
  - `getBookingPriceIdr(booking)`
  - `getBookingHostPayoutIdr(booking)`

### 3.4 Duplikasi Formatter Input Angka / Rupiah
* **Lokasi:** `HostDashboardView.tsx` (`formatCurrencyInput`), `AdminDashboardClient.tsx`, `AddPropertyClient.tsx`, dan `EditPropertyClient.tsx`.
* **Bentuk Duplikasi:** Regex pembersihan karakter non-angka lalu memformatnya menggunakan `Intl.NumberFormat`.
* **Solusi Arsitektur:** Ekstraksi fungsi `formatNumberInput(value)` ke `src/lib/format.ts`.

### 3.5 Duplikasi Komponen Badge Status Transaksi & KYC
* **Lokasi:** `HostDashboardView.tsx` (`getBadgeClass`, `getBadgeText`) dan pemetaan styling manual di `AdminDashboardClient.tsx`.
* **Solusi Arsitektur:** Buat komponen UI kecil reusable:
  - `src/components/ui/BookingStatusBadge.tsx`
  - `src/components/ui/KycStatusBadge.tsx`

### 3.6 Kurangnya Type Definitions Terpusat
* Di `AdminDashboardClient.tsx` dan `HostDashboardView.tsx`, sebagian besar properti masukan bertipe `any[]` (`initialUsers: any[]`, `initialBookings: any[]`, `properties: any[]`, `payouts: any[]`).
* **Solusi Arsitektur:** Buat berkas `src/types/index.ts` untuk memusatkan tipe data model gabungan Prisma (misal: `UserWithBank`, `BookingWithPropertyAndGuest`, `DisputeWithDetails`).

---

## 4. Rencana Struktur Folder Modular (< 250–300 Baris per Berkas)

Berikut adalah cetak biru pembagian folder modular agar seluruh berkas hasil refaktorisasi berada pada rentang ideal **80–260 baris**:

### 4.1 Modul Profil Pengguna (`src/app/profile/`)
*Dari 3.638 baris dipecah menjadi berkas-berkas modular terfokus (< 300 baris):*
```text
src/app/profile/
├── page.tsx                           (~130 baris - Server Data Fetching)
├── ProfileClient.tsx                  (~160 baris - Router Tab & Layout Wrapper Shell)
├── types.ts                           (~50 baris  - Domain types khusus profil)
├── components/
│   ├── ProfileHeader.tsx              (~214 baris - Header, avatar upload, status verifikasi)
│   ├── ProfileSidebar.tsx             (~290 baris - Navigasi tab floating modern)
│   ├── ProfileActivityMetrics.tsx     (~194 baris - Metrik aktivitas Admin / Host / Tamu)
│   ├── dialogs/
│   │   └── DeactivateAccountModal.tsx (~87 baris  - Modal proteksi deaktivasi akun)
│   └── tabs/
│       ├── personal/
│       │   ├── PersonalInfoTab.tsx    (~300 baris - Controller tab informasi pribadi)
│       │   ├── LegalNameCard.tsx      (~97 baris  - Card edit nama resmi)
│       │   ├── PersonalPhotoCard.tsx  (~195 baris - Card upload & kelola foto profil)
│       │   ├── EmailChangeSection.tsx (~284 baris - Form ganti email dengan konfirmasi password)
│       │   ├── PersonalKycCard.tsx    (~177 baris - Card status & otoritas KYC)
│       │   ├── ResidentialAddressCard.tsx (~103 baris - Card alamat domisili)
│       │   └── EmergencyContactCard.tsx   (~151 baris - Card kontak darurat)
│       ├── SecurityTab.tsx            (~303 baris - Ubah kata sandi & checklist keamanan)
│       ├── PrivacyTab.tsx             (~305 baris - UU PDP No. 27/2022, visibilitas nama, ekspor data)
│       ├── NotificationsTab.tsx       (~290 baris - Toggle preferensi notifikasi perjalanan & finansial)
│       ├── BusinessBillingTab.tsx     (~83 baris  - Controller tab penagihan bisnis & refund)
│       ├── payments/
│       │   ├── PaymentsBankingSection.tsx (~149 baris - Rekening BI-FAST host & tiket tamu)
│       │   ├── CorporateBillingSection.tsx (~229 baris - Form NPWP & data perusahaan)
│       │   └── RefundPolicyMatrix.tsx     (~120 baris - Matriks kebijakan refund transparan)
│       ├── PreferencesTab.tsx         (~110 baris - Controller tab preferensi global)
│       ├── preferences/
│       │   ├── LanguagePreferenceCard.tsx (~131 baris - Card pilihan bahasa ID / EN)
│       │   ├── CurrencyPreferenceCard.tsx (~129 baris - Card pilihan mata uang IDR / USD)
│       │   └── ThemePreferenceCard.tsx    (~131 baris - Card pilihan tema terang / gelap)
│       ├── HostingSectionTab.tsx      (~64 baris  - Switcher peran hosting)
│       └── hosting/
│           ├── AdminHostingSection.tsx    (~216 baris - Pusat tata kelola platform Super-Admin)
│           ├── HostOperationsSection.tsx  (~188 baris - Standar & parameter operasional host)
│           └── BecomeHostOpportunitySection.tsx (~90 baris - Onboarding inspiratif menjadi host)
```

### 4.2 Modul Tata Kelola Admin (`src/app/admin/`)
*Dari 2.773 baris dipecah menjadi 13 berkas terfokus:*
```text
src/app/admin/
├── page.tsx                           (~110 baris - Server Data Fetching & Parallel Upsert)
├── AdminDashboardClient.tsx           (~190 baris - Header Banner, Filter Bar, Active Tab Switcher)
├── components/
│   ├── AdminSidebar.tsx               (~140 baris - Navigasi kategori & live status widget)
│   ├── tabs/
│   │   ├── OverviewTab.tsx            (~230 baris - KPI Cards, GMV, Escrow Health, Demografi)
│   │   ├── KycAuditTab.tsx            (~240 baris - Tabel verifikasi KTP/NIK & filter)
│   │   ├── PayoutsTab.tsx             (~180 baris - Audit penarikan dana host & status)
│   │   ├── DisputesTab.tsx            (~200 baris - Manajemen sengketa garansi 24 jam)
│   │   ├── RefundsTab.tsx             (~180 baris - Antrean transfer refund manual & bukti)
│   │   ├── BookingsTab.tsx            (~170 baris - Audit transaksi pesanan & pembatalan)
│   │   ├── UsersDirectoryTab.tsx      (~140 baris - Manajemen role pengguna)
│   │   └── SystemSettingsTab.tsx      (~260 baris - Konfigurasi kurs, split fee, & fee simulator)
│   └── dialogs/
│       ├── DisputeResolutionDialog.tsx(~180 baris - Modal putusan sengketa & partial refund)
│       ├── KycRejectDialog.tsx        (~90 baris  - Modal formulir alasan penolakan KTP)
│       ├── KtpPreviewDialog.tsx       (~80 baris  - Modal lightbox pratinjau gambar KTP)
│       └── RefundConfirmDialog.tsx    (~110 baris - Modal konfirmasi transfer refund)
```

### 4.3 Modul Dasbor Host & Tamu (`src/app/dashboard/`)
*Dari 2.578 baris dipecah menjadi 10 berkas terfokus:*
```text
src/app/dashboard/
├── page.tsx                           (~170 baris - Server Data Fetching)
├── HostDashboardView.tsx              (~190 baris - Tab Router, Search Header, Status Switcher)
├── components/
│   ├── DashboardStatsHeader.tsx       (~160 baris - KPI pendapatan: Escrow Held, Released, Payout)
│   ├── tabs/
│   │   ├── PropertiesTab.tsx          (~160 baris - Manajemen listing properti host)
│   │   ├── HostBookingsTab.tsx        (~200 baris - Reservasi masuk tamu & status pembayaran)
│   │   ├── AvailabilityTab.tsx        (~190 baris - Kalender blokir tanggal & proteksi sanksi)
│   │   ├── HostPayoutsTab.tsx         (~250 baris - Form penarikan dana, bank inquiry, ledger)
│   │   └── GuestTripsTab.tsx          (~230 baris - Perjalanan tamu: tiket, voucher, & review)
│   └── dialogs/
│       ├── WithdrawConfirmDialog.tsx  (~150 baris - Modal konfirmasi penarikan saldo)
│       ├── PayoutReceiptDialog.tsx    (~120 baris - Modal tanda terima penarikan dana)
│       └── BlockDateDialog.tsx        (~130 baris - Modal tambah blokir tanggal)
```

### 4.4 Modul Formulir Properti Bersama (`src/components/properties/`)
*Menyatukan `AddPropertyClient` (562 baris) dan `EditPropertyClient` (534 baris):*
```text
src/components/properties/
├── PropertyForm.tsx                   (~240 baris - Controller formulir bersama create & edit)
├── PropertyLocationSection.tsx        (~120 baris - Input alamat & koordinat peta GIS)
├── PropertyPricingSection.tsx         (~130 baris - Harga IDR, estimasi USD, cleaning fee)
└── PropertyAmenitiesSection.tsx       (~140 baris - Katalog fasilitas & kebijakan pembatalan)
```
*Hasil pada halaman klien:*
- `src/app/properties/new/AddPropertyClient.tsx` menyusut menjadi **~40 baris** (hanya memanggil `<PropertyForm mode="create" />`).
- `src/app/properties/[id]/edit/EditPropertyClient.tsx` menyusut menjadi **~45 baris** (hanya memanggil `<PropertyForm mode="edit" initialData={property} />`).

### 4.5 Modul Kalender & Pemilih Tamu Bersama (`src/components/calendar/`)
*Menyederhanakan `BookingClient` (806 baris) dan `SearchFilterBar` (724 baris):*
```text
src/components/calendar/
├── DualMonthCalendar.tsx              (~220 baris - Kalender rentang 2 bulan interaktif bersama)
├── GuestCounterDropdown.tsx           (~140 baris - Popover counter dewasa, anak, balita)
└── DestinationSuggestions.tsx         (~90 baris  - Autocomplete rekomendasi destinasi Indonesia)
```
*Hasil pada komponen:*
- `BookingClient.tsx` menyusut dari 806 baris menjadi **~220 baris**.
- `SearchFilterBar.tsx` menyusut dari 724 baris menjadi **~180 baris**.

### 4.6 Modul Kamus Terjemahan (`src/lib/dictionaries/`)
*Dari 694 baris dipecah menjadi berkas bahasa terisolasi:*
```text
src/lib/dictionaries/
├── index.ts                           (~30 baris  - Helper getDictionary & export typing)
├── id.ts                              (~340 baris - Kamus Bahasa Indonesia murni)
└── en.ts                              (~340 baris - Kamus Bahasa Inggris murni)
```

---

## 5. Rencana Tahapan Eksekusi (*Execution Roadmap*)

Untuk menjaga aplikasi tetap stabil dan lulus uji kompilasi pada setiap langkahnya, proses refaktorisasi direkomendasikan berjalan dalam 6 *milestone* bertahap:

* [x] **Milestone 1:** Ekstraksi Shared Utilities & Types (`src/types/index.ts`, `getBookingPriceIdr`, `formatNumberInput`).
* [x] **Milestone 2:** Refaktorisasi Formulir Properti Bersama (`PropertyForm` menyatukan `AddPropertyClient` & `EditPropertyClient`).
* [x] **Milestone 3:** Pemisahan Kamus Terjemahan (`src/lib/dictionaries/`).
* [x] **Milestone 4:** Ekstraksi Kalender & Guest Picker (`DualMonthCalendar` untuk `BookingClient` & `SearchFilterBar`).
* [x] **Milestone 5:** Pemecahan Modular `HostDashboardView.tsx` (Dasbor Host & Tamu per Tab).
* [x] **Milestone 6:** Pemecahan Modular `AdminDashboardClient.tsx` (Portal Tata Kelola Admin per Tab).
* [x] **Milestone 7:** Pemecahan Modular `ProfileClient.tsx` (Pengaturan Akun & Privasi per Tab).

---

> **Status Eksekusi Keseluruhan:** Seluruh 7 Milestone refaktorisasi arsitektur telah selesai 100% dengan standar kebersihan kode tinggi, modular (< 250–300 baris per file), tanpa `any` type escapes, dan lulus verifikasi penuh `tsc --noEmit` serta `next build`.

---

*Laporan ini disimpan di berkas: **`REFACTORING_PLAN.md`** di root repositori.*
