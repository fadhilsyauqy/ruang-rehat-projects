import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendBookingConfirmationEmail, sendHostNewBookingEmail } from "@/lib/notifications"

export async function POST(req: Request) {
  try {
    const { order_id } = await req.json()

    if (!order_id) {
      return NextResponse.json({ error: "Order ID required" }, { status: 400 })
    }

    // Cari booking berdasarkan ID atau midtransOrderId beserta relasi Host & Guest
    const booking = await prisma.booking.findFirst({
      where: {
        OR: [
          { id: order_id },
          { midtransOrderId: order_id }
        ]
      },
      include: {
        property: {
          include: {
            host: {
              select: {
                id: true,
                name: true,
                email: true,
                notifyHostBooking: true
              }
            }
          }
        },
        guest: {
          select: {
            id: true,
            name: true,
            preferredName: true,
            email: true
          }
        }
      }
    })

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    // Update status transaksi menjadi PAID, pesanan CONFIRMED, dan dana escrow HELD
    const updatedBooking = await prisma.booking.update({
      where: { id: booking.id },
      data: { 
        paymentStatus: 'PAID',
        status: 'CONFIRMED',
        escrowStatus: 'HELD'
      }
    })

    // Kirim notifikasi email ke Host jika notifyHostBooking aktif (default true)
    const host = booking.property?.host
    if (host?.email && host.notifyHostBooking !== false) {
      const guestDisplayName = booking.guest?.preferredName || booking.guest?.name || "Tamu Ruang Rehat"
      sendHostNewBookingEmail({
        hostEmail: host.email,
        hostName: host.name,
        propertyName: booking.property.title,
        startDate: booking.startDate,
        endDate: booking.endDate,
        guestName: guestDisplayName,
        guestsCount: booking.guestsCount || 1,
        totalNights: booking.totalNights || 1,
        netHostPayoutIdr: booking.netHostPayoutIdr || 0,
        bookingId: booking.id
      }).catch((err) => {
        console.error("[sendHostNewBookingEmail Error]:", err)
      })
    }

    // Kirim notifikasi email konfirmasi ke Tamu
    if (booking.guest?.email) {
      sendBookingConfirmationEmail(
        booking.guest.email,
        booking.property.title,
        booking.startDate,
        booking.endDate
      ).catch((err) => {
        console.error("[sendBookingConfirmationEmail Error]:", err)
      })
    }

    return NextResponse.json({ success: true, booking: updatedBooking })
  } catch (error: any) {
    console.error("Payment Success handler error:", error)
    return NextResponse.json({ error: error.message || "Failed to update status" }, { status: 500 })
  }
}
