import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const { order_id } = await req.json()

    if (!order_id) {
      return NextResponse.json({ error: "Order ID required" }, { status: 400 })
    }

    // Untuk keperluan simulasi di localhost (karena localhost tidak bisa menerima Webhook langsung dari Midtrans)
    // Langsung update status menjadi PAID dan escrowStatus HELD saat klien melaporkan onSuccess
    await prisma.booking.update({
      where: { id: order_id },
      data: { 
        paymentStatus: 'PAID',
        status: 'CONFIRMED',
        escrowStatus: 'HELD'
      }
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Failed to update status" }, { status: 500 })
  }
}
