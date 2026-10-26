import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { PaymentStatus, BookingStatus, EscrowStatus } from "@prisma/client"
import { sendBookingConfirmationEmail, sendHostNewBookingEmail } from "@/lib/notifications"
// @ts-ignore
import midtransClient from "midtrans-client"

function getSnapClient() {
  const serverKey = process.env.MIDTRANS_SERVER_KEY
  if (!serverKey) {
    throw new Error("MIDTRANS_SERVER_KEY is not configured on server")
  }
  return new midtransClient.Snap({
    isProduction: process.env.MIDTRANS_IS_PRODUCTION === "true" || false,
    serverKey,
    clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || ""
  })
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const serverKey = process.env.MIDTRANS_SERVER_KEY
    if (!serverKey) {
      console.error("MIDTRANS_SERVER_KEY is not configured on server.")
      return NextResponse.json(
        { error: "Server configuration error: Kredensial gateway belum dikonfigurasi." },
        { status: 500 }
      )
    }

    const body = await req.json().catch(() => null)
    const bookingId = body?.bookingId
    if (!bookingId || typeof bookingId !== "string") {
      return NextResponse.json(
        { error: "Parameter bookingId wajib disertakan." },
        { status: 400 }
      )
    }

    // 1. Ambil data pesanan beserta relasi terkait
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
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
      return NextResponse.json(
        { error: "Pesanan tidak ditemukan." },
        { status: 404 }
      )
    }

    // 2. Otorisasi kepemilikan pesanan
    const userId = session.user.id
    const userRole = (session.user as any).role
    const isGuest = booking.guestId === userId
    const isHost = booking.property?.hostId === userId
    const isAdmin = userRole === "ADMIN"

    if (!isGuest && !isHost && !isAdmin) {
      return NextResponse.json(
        { error: "Anda tidak memiliki hak akses untuk menyinkronkan pesanan ini." },
        { status: 403 }
      )
    }

    // 3. Pengecekan status idempoten jika di database lokal sudah PAID
    if (booking.paymentStatus === "PAID") {
      return NextResponse.json({
        success: true,
        updated: false,
        paymentStatus: "PAID",
        status: booking.status,
        message: "Pesanan ini sudah terverifikasi dan berstatus lunas (PAID)."
      }, { status: 200 })
    }

    // 4. Hubungi Midtrans API (Server-to-Server Query)
    let midtransStatus: any = null
    const snap = getSnapClient()

    try {
      // Gunakan booking.id terlebih dahulu sebagai order_id resmi Midtrans
      midtransStatus = await snap.transaction.status(booking.id)
    } catch (primaryErr: any) {
      const is404 = primaryErr?.ApiResponse?.status_code === "404" || primaryErr?.status_code === "404"
      if (is404 && booking.midtransOrderId && booking.midtransOrderId !== booking.id) {
        try {
          midtransStatus = await snap.transaction.status(booking.midtransOrderId)
        } catch (fallbackErr: any) {
          const fallback404 = fallbackErr?.ApiResponse?.status_code === "404" || fallbackErr?.status_code === "404"
          if (fallback404) {
            return NextResponse.json({
              success: true,
              updated: false,
              paymentStatus: booking.paymentStatus,
              status: booking.status,
              message: "Transaksi belum tercatat di sistem pembayaran Midtrans."
            }, { status: 200 })
          }
          console.error("Midtrans status inquiry fallback error:", fallbackErr)
          return NextResponse.json(
            { error: "Gagal menghubungi layanan Midtrans untuk memverifikasi transaksi." },
            { status: 502 }
          )
        }
      } else if (is404) {
        return NextResponse.json({
          success: true,
          updated: false,
          paymentStatus: booking.paymentStatus,
          status: booking.status,
          message: "Transaksi belum tercatat di sistem pembayaran Midtrans."
        }, { status: 200 })
      } else {
        console.error("Midtrans status inquiry error:", primaryErr)
        return NextResponse.json(
          { error: "Gagal menghubungi layanan Midtrans untuk memverifikasi transaksi." },
          { status: 502 }
        )
      }
    }

    // 5. Pemetaan status transaksi dari Midtrans
    const { transaction_status, fraud_status } = midtransStatus || {}

    let targetPaymentStatus: PaymentStatus = booking.paymentStatus
    let targetBookingStatus: BookingStatus = booking.status
    let targetEscrowStatus: EscrowStatus | undefined = undefined

    if (transaction_status === "capture" || transaction_status === "settlement") {
      if (fraud_status === "challenge") {
        targetPaymentStatus = PaymentStatus.PENDING
      } else if (fraud_status === "accept" || !fraud_status) {
        targetPaymentStatus = PaymentStatus.PAID
        targetBookingStatus = BookingStatus.CONFIRMED
        targetEscrowStatus = EscrowStatus.HELD
      }
    } else if (transaction_status === "expire") {
      targetPaymentStatus = PaymentStatus.EXPIRED
      targetBookingStatus = BookingStatus.CANCELLED
    } else if (transaction_status === "cancel" || transaction_status === "deny") {
      targetPaymentStatus = PaymentStatus.FAILED
      targetBookingStatus = BookingStatus.CANCELLED
    } else if (transaction_status === "pending") {
      targetPaymentStatus = PaymentStatus.PENDING
    }

    const isBecomingPaid = targetPaymentStatus === PaymentStatus.PAID && (booking.paymentStatus as PaymentStatus) !== PaymentStatus.PAID
    const isChanged = targetPaymentStatus !== booking.paymentStatus || targetBookingStatus !== booking.status

    // 6. Picu email notifikasi jika status beralih menjadi PAID
    if (isBecomingPaid) {
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
        }).catch(console.error)
      }

      if (booking.guest?.email) {
        sendBookingConfirmationEmail(
          booking.guest.email,
          booking.property.title,
          booking.startDate,
          booking.endDate
        ).catch(console.error)
      }
    }

    // 7. Update database secara atomik jika terjadi perubahan status
    if (isChanged) {
      await prisma.booking.update({
        where: { id: booking.id },
        data: {
          paymentStatus: targetPaymentStatus,
          status: targetBookingStatus,
          ...(targetEscrowStatus ? { escrowStatus: targetEscrowStatus } : {})
        }
      })
    }

    // 8. Bentuk pesan respon informatif
    let message = "Status pembayaran belum berubah."
    if (targetPaymentStatus === "PAID") {
      message = isBecomingPaid
        ? "Pembayaran berhasil diverifikasi. Pesanan Anda telah terkonfirmasi!"
        : "Pesanan telah terkonfirmasi."
    } else if (targetPaymentStatus === "EXPIRED") {
      message = "Waktu pembayaran pesanan telah kedaluwarsa."
    } else if (targetPaymentStatus === "FAILED") {
      message = "Pembayaran ditolak atau dibatalkan oleh penyedia pembayaran."
    } else if (targetPaymentStatus === "PENDING") {
      message = "Pembayaran belum diselesaikan di payment gateway."
    }

    return NextResponse.json({
      success: true,
      updated: isChanged,
      paymentStatus: targetPaymentStatus,
      status: targetBookingStatus,
      message
    }, { status: 200 })

  } catch (error: any) {
    console.error("Payment Sync Error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
