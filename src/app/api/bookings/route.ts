import { NextResponse } from "next/server"

/**
 * DEPRECATED / DISABLED ENDPOINT:
 * Endpoint POST /api/bookings ini dinonaktifkan demi integritas transaksi dan keamanan finansial.
 * Pembuatan reservasi langsung tanpa melalui alur verifikasi pembayaran Midtrans dilarang.
 * 
 * Silakan gunakan alur resmi:
 * 1. POST /api/payment/checkout (membuat booking status PENDING & menghasilkan token Midtrans Snap)
 * 2. POST /api/webhooks/midtrans (webhook resmi verifikasi digital signature untuk konfirmasi status PAID)
 */
export async function POST() {
  return NextResponse.json(
    {
      error: "Metode tidak diizinkan. Pembuatan pesanan langsung tanpa pembayaran telah dinonaktifkan demi keamanan. Silakan gunakan alur pembayaran resmi melalui endpoint /api/payment/checkout.",
      redirectTo: "/api/payment/checkout"
    },
    { status: 405 }
  )
}
