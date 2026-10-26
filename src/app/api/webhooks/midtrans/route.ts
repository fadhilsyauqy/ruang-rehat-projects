import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
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
    
    // Verifikasi Signature Midtrans untuk keamanan
    const hash = crypto.createHash("sha512")
    hash.update(`${order_id}${status_code}${gross_amount}${serverKey}`)
    const calculatedSignature = hash.digest("hex")

    if (calculatedSignature !== signature_key) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 })
    }

    // Logic update status berdasarkan transaksi Midtrans
    let paymentStatus: "PENDING" | "PAID" | "FAILED" | "CANCELLED" | "EXPIRED" = "PENDING"
    let bookingStatus: "PENDING" | "CONFIRMED" | "CANCELLED" = "PENDING"
    let escrowStatus: "HELD" | "RELEASED" | "REFUNDED_TO_GUEST" | undefined = undefined

    if (transaction_status === 'capture' || transaction_status === 'settlement') {
      if (fraud_status === 'challenge') {
        paymentStatus = 'PENDING'
      } else if (fraud_status === 'accept' || !fraud_status) {
        paymentStatus = 'PAID'
        bookingStatus = 'CONFIRMED'
        escrowStatus = 'HELD'
      }
    } else if (transaction_status === 'expire') {
      paymentStatus = 'EXPIRED'
      bookingStatus = 'CANCELLED'
    } else if (transaction_status === 'cancel' || transaction_status === 'deny') {
      paymentStatus = 'FAILED'
      bookingStatus = 'CANCELLED'
    } else if (transaction_status === 'pending') {
      paymentStatus = 'PENDING'
    }

    // Jika pembayaran berhasil (PAID), kirim email notifikasi kepada Host dan Tamu
    if (paymentStatus === 'PAID') {
      const existingBooking = await prisma.booking.findUnique({
        where: { id: order_id },
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

      if (existingBooking && existingBooking.paymentStatus !== 'PAID') {
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
    }

    // Update database
    await prisma.booking.update({
      where: { id: order_id },
      data: { 
        paymentStatus: paymentStatus,
        status: bookingStatus,
        ...(escrowStatus ? { escrowStatus } : {})
      }
    })

    return NextResponse.json({ status: "OK" }, { status: 200 })

  } catch (error: any) {
    console.error("Webhook Error:", error)
    return NextResponse.json({ error: "Webhook Error" }, { status: 500 })
  }
}
