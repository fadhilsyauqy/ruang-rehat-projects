import { NextResponse } from "next/server"

/**
 * DEPRECATED / DISABLED ENDPOINT:
 * Endpoint POST /api/payment/success ini dinonaktifkan demi keamanan transaksi finansial.
 * Mengubah status booking menjadi PAID secara sepihak dari sisi client tanpa verifikasi digital signature
 * merupakan celah keamanan kritis (backdoor).
 * 
 * Seluruh status pembayaran hanya dapat diperbarui secara resmi dan aman oleh gateway Midtrans
 * melalui Webhook berotentikasi kriptografis SHA-512 pada /api/webhooks/midtrans.
 */
export async function POST() {
  return NextResponse.json(
    {
      error: "Metode tidak diizinkan. Pembaruan status pembayaran manual dari klien telah dinonaktifkan demi keamanan sistem. Status pembayaran hanya dapat diperbarui melalui webhook resmi Midtrans."
    },
    { status: 405 }
  )
}

export async function GET() {
  return NextResponse.json(
    { error: "Method Not Allowed" },
    { status: 405 }
  )
}
