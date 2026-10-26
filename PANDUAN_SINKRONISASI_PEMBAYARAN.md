# 📘 Panduan & Spesifikasi Arsitektur: Sinkronisasi Status Pembayaran (Dual-Verification System)

Dokumen ini mendefinisikan arsitektur, spesifikasi teknis, dan panduan penanganan kasus **"Pembayaran Berhasil di Midtrans tetapi Status di Sistem Masih Menunggu Pembayaran"**, serta implementasi sistem verifikasi ganda (*Push + Pull*) berstandar industri FinTech.

---

## 1. Analisis Masalah (Problem Statement)

### 1.1. Kasus Webhook Tidak Sampai di Lingkungan Lokal (Localhost)
* **Kondisi:** Pengguna melakukan pembayaran melalui Sandbox Midtrans (Virtual Account / QRIS). Di portal Midtrans status sudah berubah menjadi `Settlement` (berhasil), namun di dasbor aplikasi status pesanan tetap `MENUNGGU PEMBAYARAN`.
* **Akar Masalah:**
  - Pada arsitektur backend yang aman, status `PAID` hanya boleh diubah oleh server, bukan oleh manipulasi browser klien.
  - Server Midtrans berada di **jaringan internet publik (cloud)**, sedangkan aplikasi pengembangan berjalan di **laptop lokal (`http://localhost:3000`)**.
  - Server Midtrans tidak dapat menjangkau atau merutekan paket HTTP ke alamat privat/localhost pengembang tanpa terowongan khusus (*tunnel*). Akibatnya, webhook Midtrans tidak pernah mendarat di laptop pengembang.

### 1.2. Kasus Webhook Latency / Network Drop di Lingkungan Production
* Di lingkungan produksi (*live*), webhook dari payment gateway terkadang mengalami *delay* (beberapa detik hingga beberapa menit) akibat antrean notifikasi atau lonjakan transaksi.
* Jika pengguna langsung menekan tombol kembali ke dasbor sebelum webhook selesai diproses, pengguna akan melihat status pesanannya masih "Menunggu Pembayaran", yang menimbulkan kebingungan (*bad user experience*).

### 1.3. Kasus Redireksi Snap "Back" ke `example.com`
* **Kondisi:** Saat menyelesaikan pembayaran di widget Snap Midtrans dan menekan tombol **"Back"**, browser terlempar ke `example.com`.
* **Akar Masalah:** Parameter transaksi pembuatan token Snap belum menyertakan konfigurasi `callbacks.finish` secara eksplisit, sehingga Midtrans menggunakan fallback bawaan akun sandbox (`http://example.com`).

---

## 2. Arsitektur Solusi: Dual-Verification System (Push + Pull)

Untuk mengatasi seluruh skenario di atas dan memastikan sistem memiliki ketahanan (*resilience*) 100%, sistem mengadopsi standar verifikasi transaksi ganda:

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                          ARSITEKTUR DUAL-VERIFIKASI                         │
└─────────────────────────────────────────────────────────────────────────────┘

       [ JALUR 1: PUSH / ASINKRON (Webhook) ]
       Midtrans Cloud ────(HTTP POST Notifikasi)────► /api/webhooks/midtrans
       (Otomatis saat ada event pembayaran; butuh IP Publik / Ngrok di dev)

                                     DAN

       [ JALUR 2: PULL / SINKRON (Active Query Verification) ]
       Browser Tamu ────(Klik 'Cek Status' / Auto-Sync)────► /api/payment/sync
                                                                    │
                                            (Query Resmi Outbound)  │
                                            GET /v2/{order_id}/status
                                                                    ▼
                                                            Midtrans API Server
```

### Perbandingan Kedua Jalur:

| Aspek | Jalur 1: Push (Webhook) | Jalur 2: Pull (Sync Verification) |
| :--- | :--- | :--- |
| **Arah Permintaan** | Midtrans ➔ Server Kita (Inbound) | Server Kita ➔ Midtrans (Outbound) |
| **Kebutuhan Localhost** | Butuh Ngrok / Cloudflare Tunnel | **Tidak butuh alat apapun (Bekerja langsung)** |
| **Pemicu (Trigger)** | Event pembayaran dari gateway | Tombol manual pengguna / auto-fetch saat render |
| **Kelebihan** | Otomatis tanpa interaksi pengguna | Solusi penyelamat saat webhook lambat/gagal kirim |
| **Keamanan** | Digital Signature SHA-512 | Server-to-Server Auth (`MIDTRANS_SERVER_KEY`) |

---

## 3. Spesifikasi Teknis Endpoint: `POST /api/payment/sync`

### 3.1. Karakteristik Endpoint
* **Metode:** `POST`
* **URL:** `/api/payment/sync`
* **Otentikasi:** Wajib Sesi Login (`auth()`)
* **Otorisasi:** Pengguna hanya dapat menyinkronkan pesanannya sendiri (`booking.guestId === session.user.id`), kecuali Admin/Host pemilik properti.

### 3.2. Payload Permintaan (Request Body)
```json
{
  "bookingId": "cmvp9pume000dkylsz47u7s6j"
}
```

### 3.3. Logika Pemrosesan Server
1. **Validasi Sesi:** Pastikan user terautentikasi (HTTP `401` jika tidak ada sesi).
2. **Ambil Data Booking:** Cari record booking berdasarkan `bookingId` di database.
   - Kembalikan `404` jika tidak ditemukan.
   - Validasi hak akses kepemilikan pesanan (HTTP `403` jika bukan pemilik).
3. **Pengecekan Status Idempoten:**
   - Jika status booking di database sudah `paymentStatus === 'PAID'`, langsung kembalikan status `200 OK` tanpa membuang kuota request ke Midtrans.
4. **Hubungi Midtrans API (Server-to-Server):**
   - Panggil endpoint status Midtrans:
     ```http
     GET https://api.sandbox.midtrans.com/v2/{order_id}/status
     Authorization: Basic base64(MIDTRANS_SERVER_KEY + ":")
     ```
5. **Pemetaan Status Transaksi:**
   - `settlement` atau `capture` (dengan `fraud_status === 'accept'`):
     - `paymentStatus` ➔ `'PAID'`
     - `status` ➔ `'CONFIRMED'`
     - `escrowStatus` ➔ `'HELD'`
     - Picu email konfirmasi ke Tamu dan Host (jika status sebelumnya bukan `PAID`).
   - `expire`:
     - `paymentStatus` ➔ `'EXPIRED'`
     - `status` ➔ `'CANCELLED'`
   - `cancel` / `deny`:
     - `paymentStatus` ➔ `'FAILED'`
     - `status` ➔ `'CANCELLED'`
6. **Perbarui Database Secara Atomik:**
   - Update tabel `Booking` dengan status baru.
7. **Kembalikan Respon Terstruktur ke Klien.**

### 3.4. Format Respon (Responses)

#### A. Pembayaran Sukses Terverifikasi (200 OK)
```json
{
  "success": true,
  "updated": true,
  "paymentStatus": "PAID",
  "status": "CONFIRMED",
  "message": "Pembayaran berhasil diverifikasi. Pesanan Anda telah terkonfirmasi!"
}
```

#### B. Pembayaran Masih Belum Diselesaikan (200 OK)
```json
{
  "success": true,
  "updated": false,
  "paymentStatus": "PENDING",
  "status": "PENDING",
  "message": "Pembayaran belum diselesaikan di payment gateway."
}
```

#### C. Pesanan Kedaluwarsa (200 OK)
```json
{
  "success": true,
  "updated": true,
  "paymentStatus": "EXPIRED",
  "status": "CANCELLED",
  "message": "Waktu pembayaran pesanan telah habis."
}
```

#### D. Kesalahan Akses / Otorisasi (403 Forbidden)
```json
{
  "error": "Anda tidak memiliki hak akses untuk menyinkronkan pesanan ini."
}
```

---

## 4. Spesifikasi UI/UX Komponen Frontend

### 4.1. Tombol "Cek Status Pembayaran" pada Dasbor
* **Lokasi:** Kartu pesanan di halaman `/dashboard` dan `/trips` yang memiliki status `MENUNGGU PEMBAYARAN`.
* **Tampilan:**
  - Tombol sekunder dengan ikon *refresh/sync* (contoh: `<RotateCw className="w-4 h-4 mr-1.5" />`).
  - Teks: **"Cek Status"** atau **"Sudah Bayar? Cek Status"**.
* **Interaksi:**
  - Saat diklik: Tombol menampilkan state *loading* / *spinner* berputar.
  - Jika pembayaran terverifikasi: Muncul notifikasi Toast sukses (*"Pembayaran terverifikasi! Pesanan Anda telah dikonfirmasi"*), dan kartu otomatis berubah menjadi status terkonfirmasi warna biru/hijau secara instan tanpa perlu reload seluruh halaman.
  - Jika pembayaran belum lunas: Muncul Toast peringatan (*"Pembayaran belum terdeteksi. Silakan selesaikan pembayaran terlebih dahulu"*).

### 4.2. Auto-Sync pada Halaman Checkout & Dasbor
* Ketika komponen checkout mendeteksi kembalinya pengguna dari widget Midtrans, atau saat halaman dasbor pertama kali dimuat dengan parameter `?check_status=true`, sistem dapat mengeksekusi request `sync` di latar belakang secara otomatis.

---

## 5. Solusi Masalah Snap "Back" Redirect (`example.com`)

### 5.1. Implementasi Parameter `callbacks` di Backend
Setiap pembuatan Snap Token pada `src/app/api/payment/checkout/route.ts` **wajib** menyertakan parameter `callbacks`:

```typescript
const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"

const parameter = {
  transaction_details: {
    order_id: newBooking.booking.id,
    gross_amount: newBooking.totalPriceIdr,
  },
  customer_details: {
    first_name: session.user.name || "Tamu",
    email: session.user.email || "tamu@ruangrehat.com",
  },
  item_details: itemDetails,
  // Menghilangkan redirect ke example.com
  callbacks: {
    finish: `${baseUrl}/dashboard`,
    error: `${baseUrl}/dashboard`,
    pending: `${baseUrl}/dashboard`
  }
}
```

---

## 6. Panduan Pengujian di Lingkungan Lokal (Testing Guide)

### Metode A: Menggunakan Fitur Sync Status (Tanpa Setup Tambahan)
1. Buat pesanan dan lakukan pembayaran pada Simulator Sandbox Midtrans.
2. Buka Dasbor (`/dashboard`).
3. Klik tombol **"Cek Status Pembayaran"** pada kartu booking.
4. Status booking langsung berubah menjadi **Terkonfirmasi** (`PAID`).

### Metode B: Menggunakan Ngrok (Untuk Menguji Webhook Real-Time Murni)
1. Buka terminal baru dan jalankan:
   ```bash
   ngrok http 3000
   ```
2. Ambil URL forwarding yang dihasilkan (contoh: `https://xxxx.ngrok-free.app`).
3. Buka **Midtrans Dashboard (Sandbox)** ➔ **Settings** ➔ **Configuration**.
4. Masukkan URL berikut pada **Payment Notification URL**:
   ```text
   https://xxxx.ngrok-free.app/api/webhooks/midtrans
   ```
5. Simpan. Transaksi selanjutnya akan langsung otomatis ter-update via webhook tanpa perlu klik tombol apapun.

---

## 7. Checklist Implementasi Fitur

- [x] **1. Backend:** Buat endpoint `POST /api/payment/sync` dengan verifikasi otentikasi sesi dan panggilan ke Midtrans Client `status()`.
- [x] **2. Backend:** Integrasikan pengiriman email notifikasi otomatis (Host & Tamu) jika status berubah menjadi `PAID` via sinkronisasi.
- [x] **3. Frontend:** Tambahkan tombol interaktif "Cek Status" pada kartu perjalanan di `src/app/dashboard/GuestTripActions.tsx` dan `HostBookingActions.tsx`.
- [x] **4. Verification:** Uji alur end-to-end: Pesan properti ➔ Bayar di simulator ➔ Klik Cek Status ➔ Status berubah menjadi `PAID` secara instan.
