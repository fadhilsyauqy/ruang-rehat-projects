# 🛡️ Task Resolusi Keamanan Backend & Proteksi Data — Ruang Rehat

Dokumen ini adalah **panduan kerja resmi (*Single Source of Truth*)** untuk pelaksanaan perbaikan celah keamanan backend, validasi transaksi, otorisasi RBAC, anti race-condition, dan kepatuhan terhadap regulasi privasi data (UU PDP No. 27/2022) pada platform Ruang Rehat.

Setiap task disusun secara berurutan (*phased implementation*) dengan kriteria pengujian ketat guna menjamin stabilitas sistem dan **0 error TypeScript (`npx tsc --noEmit`)**.

---

## 📌 Ringkasan Status Eksekusi

| Fase / Area | Fokus Keamanan | Status | Jumlah Task |
| :--- | :--- | :---: | :---: |
| **Fase 1** | Hardcoded Secrets, Env Fallback, & Cron Security | `COMPLETED` | 3 Task |
| **Fase 2** | Eliminasi Backdoor Pembayaran & Validasi Ketat Sisi Server | `COMPLETED` | 4 Task |
| **Fase 3** | Anti Double-Booking, Concurrency Locking, & Sinkronisasi Kalender | `COMPLETED` | 3 Task |
| **Fase 4** | Keamanan Webhook Midtrans, Timing-Safe Signature, & Idempotensi | `COMPLETED` | 3 Task |
| **Fase 5** | Integritas Escrow, Atomic Payout, & Batasan Finansial Resolusi Sengketa | `COMPLETED` | 5 Task |
| **Fase 6** | Otorisasi Ketat Server-Side (RBAC), Anti-IDOR, & Mass-Assignment Guard | `COMPLETED` | 3 Task |
| **Fase 7** | Kepatuhan UU PDP No. 27/2022 & Eliminasi Data Leak pada RSC Payload | `PENDING` | 3 Task |
| **Fase 8** | Pengerasan Upload File (MIME Validation, Size Limit, & Sanitasi Folder) | `PENDING` | 3 Task |

---

## 🔒 Fase 1: Hardcoded Secrets, Env Fallback, & Cron Security

### Tujuan:
Menghilangkan seluruh API key, secret, dan kredensial asli yang tertulis langsung di source code. Memastikan server gagal secara aman (*fail-safe*) jika konfigurasi env wajib tidak tersedia, serta menutup celah akses publik pada cron worker.

### File Terkait:
- `src/app/api/upload/route.ts` (Baris 7–9)
- `src/app/api/payment/checkout/route.ts` (Baris 12–13)
- `src/app/api/webhooks/midtrans/route.ts` (Baris 19)
- `src/app/layout.tsx` (Baris 37)
- `src/app/api/cron/release-escrow/route.ts` (Baris 14–17)

### Checklist Task:
- [x] **Task 1.1: Bersihkan Kredensial Hardcoded Cloudinary**
  - Hapus fallback live API Key dan Secret Cloudinary pada `src/app/api/upload/route.ts`.
  - Baca murni dari `process.env.CLOUDINARY_CLOUD_NAME`, `process.env.CLOUDINARY_API_KEY`, dan `process.env.CLOUDINARY_API_SECRET`.
  - Jika salah satu env tidak disetel, lemparkan error konfigurasi server yang aman (500) tanpa mengekspos detail kredensial ke client.
- [x] **Task 1.2: Hapus Fallback Dummy Key Midtrans**
  - Bersihkan string dummy `"SB-Mid-server-YOUR_DUMMY_KEY"` dan `"SB-Mid-client-YOUR_DUMMY_KEY"` pada `checkout/route.ts`, `midtrans/route.ts`, dan `src/app/layout.tsx`.
  - Pastikan modul server-side memverifikasi keberadaan `MIDTRANS_SERVER_KEY` secara eksplisit dan menolak eksekusi transaksi jika variabel belum disetel di lingkungan deployment.
- [x] **Task 1.3: Amankan Otorisasi Endpoint Cron Release Escrow**
  - Perbaiki validasi `src/app/api/cron/release-escrow/route.ts:14-17`.
  - Wajibkan keberadaan `CRON_SECRET`. Jika `CRON_SECRET` tidak didefinisikan atau header `Authorization !== Bearer ${process.env.CRON_SECRET}`, tolak request dengan status `401 Unauthorized`. Cegah eksekusi publik tanpa token.

---

## 💳 Fase 2: Eliminasi Backdoor Pembayaran & Validasi Ketat Sisi Server

### Tujuan:
Menutup seluruh endpoint yang memungkinkan pembuatan booking terkonfirmasi atau pemalsuan status pembayaran tanpa melalui gateway Midtrans. Memastikan seluruh parameter booking (harga, tanggal, kuota tamu, durasi menginap) divalidasi 100% di server.

### File Terkait:
- `src/app/api/bookings/route.ts` (Baris 8–211)
- `src/app/api/payment/success/route.ts` (Baris 5–95)
- `src/app/api/payment/checkout/route.ts` (Baris 24–61, 165)
- `src/app/api/properties/blocked-dates/route.ts` (Baris 62–76)

### Checklist Task:
- [x] **Task 2.1: Nonaktifkan Endpoint Bypass `POST /api/bookings`**
  - Endpoint `POST /api/bookings` yang langsung membuat pesanan `status: 'CONFIRMED'` tanpa bayar harus dinonaktifkan atau dialihkan ke alur resmi `/api/payment/checkout`.
  - Kembalikan `405 Method Not Allowed` atau `400 Bad Request` yang menginstruksikan client untuk menggunakan alur checkout berbayar resmi.
- [x] **Task 2.2: Hapus Backdoor Konfirmasi Pembayaran `POST /api/payment/success`**
  - Endpoint `/api/payment/success` menerima `{ order_id }` tanpa auth/signature dan mengubah status booking menjadi `PAID` / `CONFIRMED`.
  - Hapus atau amankan endpoint ini: status pembayaran `PAID` hanya boleh diubah oleh webhook resmi Midtrans dengan validasi digital signature SHA-512.
- [x] **Task 2.3: Validasi Kuota Tamu Maksimal (`maxGuests`) Sisi Server**
  - Pada `src/app/api/payment/checkout/route.ts`, ambil `guestCount` properti dalam `SELECT ... FOR UPDATE`.
  - Validasi bahwa `guestsCount >= 1` dan `guestsCount <= property.guestCount`. Jika tamu melebihi kapasitas properti, tolak dengan status `400 Bad Request`.
- [x] **Task 2.4: Validasi Tanggal Masa Lalu (Past Dates Validation)**
  - Pada `checkout/route.ts` dan `properties/blocked-dates/route.ts`, validasi bahwa tanggal `startDate` tidak boleh berada di masa lalu (`startDate < hari ini dalam WIB`).
  - Cegah tamu dan host membuat reservasi atau memblokir tanggal surut.

---

## ⚡ Fase 3: Anti Double-Booking, Concurrency Locking, & Kalender

### Tujuan:
Mencegah terjadinya double-booking akibat request konkruen di detik yang sama, menyinkronkan penutupan tanggal oleh host dengan kalender pencarian publik, serta mencegah penarikan dana ganda (*double withdrawal*) oleh Host.

### File Terkait:
- `src/app/api/host/payouts/route.ts` (Baris 94–193)
- `src/app/api/properties/blocked-dates/route.ts` (Baris 39–91)
- `src/app/page.tsx` (Baris 58–72)

### Checklist Task:
- [x] **Task 3.1: Atomic Transaction & Lock pada Penarikan Dana Host (`POST /api/host/payouts`)**
  - Bungkus seluruh kalkulasi saldo yang dapat ditarik (`availableBalanceIdr`), pengecekan penalti, dan pembuatan record penarikan (`tx.payout.create`) dalam **satu Prisma Interactive Transaction atomik**.
  - Terapkan locking pada level user/payout atau serializable isolation untuk mencegah *double withdrawal* saat host mengirim beberapa request bersamaan.
  - Pindahkan mutasi `isDeducted: true` pada `hostPenalty` ke dalam transaksi yang sama sehingga jika pembuatan payout gagal, penalti tidak terpotong sepihak.
- [x] **Task 3.2: Validasi Bentrok Reservasi saat Host Memblokir Tanggal**
  - Pada `POST /api/properties/blocked-dates`, periksa apakah terdapat booking aktif (`status !== 'CANCELLED'` dan `paymentStatus !== 'FAILED'`) yang beririsan dengan tanggal yang ingin diblokir host.
  - Jika ada reservasi aktif, tolak aksi pemblokiran dengan pesan informatif agar host tidak memblokir tanggal yang sudah dibayar tamu.
- [x] **Task 3.3: Sinkronkan Pencarian Homepage (`page.tsx`) dengan `BlockedDate`**
  - Perbarui filter `whereClause` pencarian tanggal di `src/app/page.tsx`.
  - Tambahkan kondisi pengecualian properti jika terdapat record pada tabel `BlockedDate` yang beririsan dengan `checkIn` dan `checkOut` tamu (`blockedDates: { none: { startDate: { lt: checkOutDate }, endDate: { gt: checkInDate } } }`).

---

## 🛡️ Fase 4: Keamanan Webhook Midtrans, Timing-Safe Signature, & Idempotensi

### Tujuan:
Menjamin bahwa notifikasi pembayaran dari Midtrans diverifikasi secara kriptografis tanpa celah *timing attack*, serta bersifat *idempotent* sehingga webhook duplikat tidak merusak atau menimpa status pesanan dan saldo escrow.

### File Terkait:
- `src/app/api/webhooks/midtrans/route.ts` (Baris 1–69)

### Checklist Task:
- [x] **Task 4.1: Gunakan `crypto.timingSafeEqual` untuk Verifikasi Signature**
  - Ganti perbandingan string biasa `calculatedSignature !== signature_key` dengan `crypto.timingSafeEqual(Buffer.from(calculatedSignature), Buffer.from(signature_key))` dengan penanganan panjang buffer yang aman untuk menangkal celah *timing attack*.
- [x] **Task 4.2: Terapkan Prinsip Idempotensi pada Pemrosesan Webhook**
  - Periksa status booking saat ini sebelum melakukan update.
  - Jika booking sudah berstatus `paymentStatus === 'PAID'` dan status baru dari Midtrans adalah `PAID`, lewati pembaruan database dan kembalikan respon `200 OK` secara langsung (idempoten).
- [x] **Task 4.3: Proteksi Status Terminal & Status Escrow dari Timpaan Webhook**
  - Cegah webhook menimpa status jika booking telah berada pada status terminal atau sengketa:
    - Jika `booking.escrowStatus === "DISPUTED"`, jangan ubah kembali menjadi `"HELD"`.
    - Jika `booking.escrowStatus === "RELEASED"`, jangan ubah kembali menjadi `"HELD"`.
    - Jika `booking.status === "CANCELLED"` (misal telah dibatalkan karena kedaluwarsa atau refund), kelola status secara konsisten.
  - Tangani kasus jika `order_id` tidak ditemukan di database dengan respon `404` yang terformat rapi tanpa melempar exception 500 yang memicu *retry-loop* dari Midtrans.

---

## 💰 Fase 5: Integritas Escrow, Atomic Payout, & Resolusi Sengketa

### Tujuan:
Menjamin aliran dana escrow dan refund aman dari eksploitasi, mencegah pembatalan pesanan yang sedang bersengketa, dan membatasi nominal keputusan sengketa agar tidak melebihi nilai bruto pesanan.

### File Terkait:
- `src/app/api/bookings/[id]/cancel/route.ts` (Baris 48–78, 150–156)
- `src/app/api/admin/disputes/[id]/route.ts` (Baris 20–108)
- `src/app/api/admin/payouts/[id]/route.ts` (Baris 40–110)

### Checklist Task:
- [x] **Task 5.1: Kunci Pembatalan Pesanan saat Booking Berstatus Sengketa (`DISPUTED`)**
  - Pada `src/app/api/bookings/[id]/cancel/route.ts`, tambahkan pengecekan: jika `booking.escrowStatus === 'DISPUTED'`, tolak pembatalan sepihak baik oleh tamu maupun host dengan status `400 Bad Request`.
  - Seluruh alur pengembalian/pelepasan dana untuk pesanan bersengketa wajib diselesaikan melalui keputusan Admin di portal sengketa.
- [x] **Task 5.2: Kunci Pembatalan Pesanan jika Escrow Sudah Dirilis (`RELEASED`)**
  - Jika dana escrow telah dirilis ke Host (`escrowStatus === 'RELEASED'`), tamu tidak dapat membatalkan pesanan secara otomatis dengan klaim refund sistem. Arahkan tamu untuk menghubungi layanan bantuan / dispute.
- [x] **Task 5.3: Validasi Batas Maksimal Nominal Partial Refund pada Sengketa Admin**
  - Pada `src/app/api/admin/disputes/[id]/route.ts`, validasi bahwa pada keputusan `RESOLVED_PARTIAL_REFUND`:
    `finalRefundApproved + finalPayoutApproved <= bookingTotal`.
    Tolak request jika total pembagian melebihi nilai transaksi pemesanan asli.
- [x] **Task 5.4: Penguncian Status Terminal Sengketa (*Terminal State Lock*)**
  - Cegah eksekusi ulang keputusan pada sengketa yang telah berstatus `RESOLVED_RELEASE_TO_HOST`, `RESOLVED_FULL_REFUND`, `RESOLVED_PARTIAL_REFUND`, atau `REJECTED`.
  - Jika sengketa telah memiliki status penyelesaian, tolak perubahan status berulang guna menghindari inkonsistensi mutasi kas.
- [x] **Task 5.5: Pemulihan Status Penalti saat Payout Ditolak Admin (`FAILED`)**
  - Pada `src/app/api/admin/payouts/[id]/route.ts`, jika admin mengubah status penarikan menjadi `FAILED`, kembalikan penalti yang sebelumnya terpotong menjadi `isDeducted: false` agar dapat dipotong pada penarikan berikutnya.

---

## 👥 Fase 6: Otorisasi Ketat Server-Side (RBAC), Anti-IDOR, & Mass-Assignment

### Tujuan:
Memastikan setiap mutasi data memverifikasi sesi login dan kepemilikan data (Anti-IDOR), membersihkan *mass assignment* pada pembaruan properti, serta mencegah manipulasi rating ulasan dan spamming.

### File Terkait:
- `src/app/api/properties/[id]/route.ts` (Baris 54–75)
- `src/app/api/reviews/route.ts` (Baris 13–47)
- `src/app/api/properties/route.ts` (Baris 80–100)

### Checklist Task:
- [x] **Task 6.1: Bersihkan Mass-Assignment pada Pembaruan Properti (`PUT /api/properties/[id]`)**
  - Hapus penggunaan spread operator `...rest` langsung ke `prisma.property.update`.
  - Buat *whitelist* field eksplisit yang boleh diubah oleh Host (misal: `title`, `description`, `pricePerNight`, `cleaningFee`, `amenities`, `maxGuests`, `address`, `category`, `images`, `cancellationPolicy`).
  - Cegah manipulasi field terproteksi seperti `hostId`, `cancellationCount`, `isPublished`, dan `id`.
- [x] **Task 6.2: Validasi Integer Rating (1–5) & Pencegahan Duplikasi Review**
  - Pada `src/app/api/reviews/route.ts`, pastikan `Number.isInteger(rating)` dan berada di antara `1 <= rating <= 5`.
  - Periksa apakah user telah pernah mengirim ulasan untuk `bookingId` terkait (`prisma.review.findFirst({ where: { bookingId } })`). Jika sudah ada, tolak request untuk mencegah spamming review.
- [x] **Task 6.3: Validasi Kepemilikan pada Operasi Hapus Properti (`DELETE`)**
  - Pastikan properti yang memiliki pemesanan aktif berstatus `CONFIRMED` atau `PAID` di masa mendatang tidak dapat dihapus oleh Host untuk melindungi hak tamu yang sudah memesan.

---

## 🕵️ Fase 7: Kepatuhan UU PDP No. 27/2022 & Eliminasi Data Leak pada RSC Payload

### Tujuan:
Mencegah kebocoran data sensitif pribadi (password hash bcrypt, NIK KTP, URL foto KTP fisik, nomor HP pribadi, alamat rumah, NPWP) ke browser publik melalui serialisasi React Server Components (RSC Flight Data).

### File Terkait:
- `src/app/properties/[id]/page.tsx` (Baris 37–57, 246–255)
- `src/app/dashboard/page.tsx` (Baris 90–113)
- `src/app/admin/page.tsx` (Baris 40–44)

### Checklist Task:
- [ ] **Task 7.1: Seleksi Eksplisit Data Host & Guest pada Halaman Detail Properti (`properties/[id]/page.tsx`)**
  - Ubah `host: true` menjadi seleksi eksplisit hanya field publik yang dibutuhkan UI:
    ```ts
    host: {
      select: {
        id: true,
        name: true,
        preferredName: true,
        image: true,
        createdAt: true,
        kycStatus: true,
      }
    }
    ```
  - Ubah `reviews: { include: { guest: true } }` menjadi seleksi eksplisit:
    ```ts
    guest: {
      select: {
        id: true,
        name: true,
        preferredName: true,
        image: true,
        hideLastNameReview: true,
      }
    }
    ```
  - **100% hilangkan:** `password`, `idCardNumber`, `idCardUrl`, `phoneNumber`, `address`, `billingTaxId`, `emergencyContact*` dari transmisi ke client browser publik.
- [ ] **Task 7.2: Seleksi Eksplisit Data Pemesan & Host pada Dashboard Pengguna (`dashboard/page.tsx`)**
  - Pada query `incomingBookings` (tampilan Host), pilih hanya field tamu yang relevan (`id, name, preferredName, email, phoneNumber, address, emergencyContact*`). Blokir `password`, `idCardUrl`, dan `idCardNumber`.
  - Pada query `myBookings` (tampilan Tamu), pilih hanya field host yang relevan (`id, name, preferredName, email, phoneNumber, image`). Blokir `password`, `idCardUrl`, `idCardNumber`, dan `billingTaxId`.
- [ ] **Task 7.3: Hapus Password Hash Seluruh Pengguna dari Komponen Admin (`admin/page.tsx`)**
  - Pada query `prisma.user.findMany({ include: { bankAccount: true } })`, gunakan `select` eksplisit yang mencakup seluruh data tata kelola admin, namun **secara tegas mengecualikan kolom `password`**.

---

## 📁 Fase 8: Pengerasan Upload File (MIME Validation, Size Limit, & Folder)

### Tujuan:
Mencegah pengunggahan malware/skrip XSS (seperti `.html` atau `.svg`), mencegah *Denial of Service* (DoS) akibat memory buffer exhaustion pada payload file besar, serta memisahkan penyimpanan dokumen identitas sensitif (KTP) dari foto publik listing.

### File Terkait:
- `src/app/api/upload/route.ts` (Baris 1–48)
- `src/app/api/kyc/submit/route.ts`

### Checklist Task:
- [ ] **Task 8.1: Validasi MIME Type Sisi Server**
  - Validasi bahwa `file.type` wajib merupakan gambar yang diizinkan: `['image/jpeg', 'image/png', 'image/webp']`.
  - Tolak file berformat `.svg`, `.html`, `.exe`, `.pdf`, atau skrip eksekutabel lainnya dengan status `400 Bad Request`.
- [ ] **Task 8.2: Batasi Ukuran File Maksimal (Max File Size Guard)**
  - Periksa ukuran file sebelum mengalokasikan memori buffer (`file.size <= 5 * 1024 * 1024` atau maksimal 5 MB).
  - Tolak file yang melebihi batas ukuran dengan status `413 Payload Too Large` untuk melindungi RAM server dari crash OOM (*Out of Memory*).
- [ ] **Task 8.3: Sanitasi dan Kategorisasi Folder Penyimpanan**
  - Terima parameter `folder` opsional yang divalidasi ketat (`properties`, `avatars`, `kyc`, `refunds`).
  - Pastikan dokumen identitas KTP dan bukti transfer refund diunggah ke folder terisolasi yang sesuai dan tidak tercampur dalam galeri properti umum.

---

## 🧪 Panduan Verifikasi & Quality Gate

Setiap penyelesaian fase task wajib lolos pengujian:
1. **Type Safety:** Jalankan `npx tsc --noEmit` dan pastikan hasil menunjukkan **0 error**.
2. **Next.js Production Build:** Jalankan `npm run build` dan pastikan seluruh 35+ routes terkompilasi dengan sukses tanpa kegagalan SSR/RSC.
3. **Data Leak Inspection:** Periksa payload Flight HTML pada `/properties/[id]` untuk memastikan tidak ada substring hash bcrypt (`$2a$` / `$2b$`) atau NIK KTP yang terekspos.
4. **Business Math Integrity:** Pastikan seluruh perhitungan tetap menggunakan kurs dinamis `SystemSetting` dan integer murni IDR tanpa float rounding error.
