import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { PaymentStatus, BookingStatus, EscrowStatus } from "@prisma/client"
import crypto from "crypto"
import { sendBookingConfirmationEmail, sendHostNewBookingEmail } from "@/lib/notifications"

export async function POST(req: Request) {
  try {
    const data = await req.json()

    // Data dari notifikasi Midtrans
    const { 
      order_id, 
      status_code, 
      gross_amount, 
      signature_key, 
      transaction_status,
      fraud_status
    } = data

    const serverKey = process.env.MIDTRANS_SERVER_KEY
    if (!serverKey) {
      console.error("MIDTRANS_SERVER_KEY is not configured on server.")
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }

    if (!order_id || !status_code || !gross_amount || typeof signature_key !== "string") {
      return NextResponse.json({ error: "Missing required webhook parameters" }, { status: 400 })
    }
    
    // Task 4.1: Verifikasi Signature Midtrans dengan timingSafeEqual
    const hash = crypto.createHash("sha512")
    hash.update(`${order_id}${status_code}${gross_amount}${serverKey}`)
    const calculatedSignature = hash.digest("hex")

    // Periksa panjang byte (Buffer.byteLength) sebelum timingSafeEqual untuk menangkal RangeError
    const calculatedBuffer = Buffer.from(calculatedSignature, "utf8")
    const receivedBuffer = Buffer.from(signature_key, "utf8")

    if (calculatedBuffer.length !== receivedBuffer.length || !crypto.timingSafeEqual(calculatedBuffer, receivedBuffer)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 })
    }

    // Task 4.3: Cari pesanan dan tangani kasus jika tidak ditemukan dengan status 404 bersih
    const existingBooking = await prisma.booking.findFirst({
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
              select: { id: true, name: true, email: true, notifyHostBooking: true }
            }
          }
        },
        guest: {
          select: { id: true, name: true, preferredName: true, email: true }
        }
      }
    })

    if (!existingBooking) {
      return NextResponse.json({ error: "Booking order not found" }, { status: 404 })
    }

    // Logic penentuan status berdasarkan payload Midtrans
    let targetPaymentStatus: PaymentStatus = existingBooking.paymentStatus
    let targetBookingStatus: BookingStatus = existingBooking.status
    let targetEscrowStatus: EscrowStatus | undefined = undefined

    if (transaction_status === 'capture' || transaction_status === 'settlement') {
      if (fraud_status === 'challenge') {
        targetPaymentStatus = PaymentStatus.PENDING
      } else if (fraud_status === 'accept' || !fraud_status) {
        targetPaymentStatus = PaymentStatus.PAID
        targetBookingStatus = BookingStatus.CONFIRMED
        targetEscrowStatus = EscrowStatus.HELD
      }
    } else if (transaction_status === 'expire') {
      targetPaymentStatus = PaymentStatus.EXPIRED
      targetBookingStatus = BookingStatus.CANCELLED
    } else if (transaction_status === 'cancel' || transaction_status === 'deny') {
      targetPaymentStatus = PaymentStatus.FAILED
      targetBookingStatus = BookingStatus.CANCELLED
    } else if (transaction_status === 'pending') {
      targetPaymentStatus = PaymentStatus.PENDING
    }

    // Task 4.2: Terapkan prinsip idempotensi
    // Jika pesanan sudah PAID dan status transaksi baru juga PAID, lewati pembaruan dan return 200 OK langsung
    if (existingBooking.paymentStatus === PaymentStatus.PAID && targetPaymentStatus === PaymentStatus.PAID) {
      return NextResponse.json({ 
        status: "OK", 
        message: "Notification already processed (idempotent)" 
      }, { status: 200 })
    }

    // Task 4.3: Proteksi status escrow
    // Jika status escrow sudah DISPUTED, RELEASED, atau REFUNDED_TO_GUEST, jangan timpa kembali menjadi HELD
    if (
      existingBooking.escrowStatus === EscrowStatus.DISPUTED || 
      existingBooking.escrowStatus === EscrowStatus.RELEASED ||
      existingBooking.escrowStatus === EscrowStatus.REFUNDED_TO_GUEST ||
      existingBooking.escrowStatus === EscrowStatus.PARTIAL_REFUND
    ) {
      targetEscrowStatus = undefined
    }

    // Task 4.3: Proteksi status booking terminal
    // Jika pesanan sudah CANCELLED, COMPLETED, atau DISPUTED, jangan ubah status booking kembali ke CONFIRMED atau PENDING
    if (existingBooking.status === BookingStatus.CANCELLED) {
      targetBookingStatus = BookingStatus.CANCELLED
    } else if (existingBooking.status === BookingStatus.COMPLETED) {
      targetBookingStatus = BookingStatus.COMPLETED
    } else if (existingBooking.status === BookingStatus.DISPUTED) {
      targetBookingStatus = BookingStatus.DISPUTED
    }

    // Kirim notifikasi jika status beralih menjadi PAID untuk pertama kali dan pesanan tidak dibatalkan
    const isBecomingPaid = targetPaymentStatus === PaymentStatus.PAID && existingBooking.paymentStatus !== PaymentStatus.PAID
    if (isBecomingPaid && existingBooking.status !== BookingStatus.CANCELLED) {
      const host = existingBooking.property?.host
      if (host?.email && host.notifyHostBooking !== false) {
        const guestDisplayName = existingBooking.guest?.preferredName || existingBooking.guest?.name || "Tamu Ruang Rehat"
        sendHostNewBookingEmail({
          hostEmail: host.email,
          hostName: host.name,
          propertyName: existingBooking.property.title,
          startDate: existingBooking.startDate,
          endDate: existingBooking.endDate,
          guestName: guestDisplayName,
          guestsCount: existingBooking.guestsCount || 1,
          totalNights: existingBooking.totalNights || 1,
          netHostPayoutIdr: existingBooking.netHostPayoutIdr || 0,
          bookingId: existingBooking.id
        }).catch(console.error)
      }

      if (existingBooking.guest?.email) {
        sendBookingConfirmationEmail(
          existingBooking.guest.email,
          existingBooking.property.title,
          existingBooking.startDate,
          existingBooking.endDate
        ).catch(console.error)
      }
    }

    // Update database
    await prisma.booking.update({
      where: { id: existingBooking.id },
      data: { 
        paymentStatus: targetPaymentStatus,
        status: targetBookingStatus,
        ...(targetEscrowStatus ? { escrowStatus: targetEscrowStatus } : {})
      }
    })

    return NextResponse.json({ status: "OK" }, { status: 200 })

  } catch (error: unknown) {
    console.error("Webhook Error:", error)
    return NextResponse.json({ error: "Webhook Error" }, { status: 500 })
  }
}
