import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import crypto from "crypto"

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

    const serverKey = process.env.MIDTRANS_SERVER_KEY || "SB-Mid-server-YOUR_DUMMY_KEY"
    
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
