import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { toCheckInDateTimeWIB, toCheckOutDateTimeWIB, toEscrowReleaseDateTimeWIB, calculateStayNights } from "@/lib/date-standards"
import { getSystemSettings, calculateBookingFinancials } from "@/lib/settings"
// @ts-ignore
import midtransClient from "midtrans-client"

// Konfigurasi Midtrans Snap API
const snap = new midtransClient.Snap({
  isProduction: false, // Sandbox mode
  serverKey: process.env.MIDTRANS_SERVER_KEY || "SB-Mid-server-YOUR_DUMMY_KEY",
  clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || "SB-Mid-client-YOUR_DUMMY_KEY"
})

export async function POST(req: Request) {
  const session = await auth()
  
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const data = await req.json()
    const { propertyId, startDate, endDate, totalPrice, guests } = data
    
    if (!propertyId || !startDate || !endDate || totalPrice == null) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Standarisasi Waktu Indonesia (WIB): Check-in 14:00 WIB, Check-out 12:00 WIB
    const start = toCheckInDateTimeWIB(startDate)
    const end = toCheckOutDateTimeWIB(endDate)

    if (start >= end) {
      return NextResponse.json({ error: "Invalid dates" }, { status: 400 })
    }

    // Standar Airbnb: Pencegahan Self-Booking (Host dilarang memesan properti miliknya sendiri)
    const propertyCheck = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { 
        id: true, 
        title: true, 
        hostId: true, 
        price: true, 
        cleaningFee: true,
        cancellationPolicy: true 
      }
    })

    if (!propertyCheck) {
      return NextResponse.json({ error: "Properti tidak ditemukan" }, { status: 404 })
    }

    if (propertyCheck.hostId === session.user.id) {
      return NextResponse.json(
        { error: "Anda tidak dapat memesan properti milik Anda sendiri." },
        { status: 400 }
      )
    }

    // 1. Transaction Lock untuk Anti-Double Booking & Pembersihan Booking Kedaluwarsa
    const newBooking = await prisma.$transaction(async (tx) => {
      // Row-level lock pada properti
      const properties = await tx.$queryRaw<{ 
        id: string, 
        title: string, 
        hostId: string, 
        price: number, 
        pricePerNight: number,
        cleaningFee: number,
        maxStayNights: number 
      }[]>`
        SELECT id, title, "hostId", price, "pricePerNight", "cleaningFee", "maxStayNights" FROM "Property" WHERE id = ${propertyId} FOR UPDATE
      `

      if (properties.length === 0) throw new Error("Property not found")
      if (properties[0].hostId === session.user!.id) {
        throw new Error("Anda tidak dapat memesan properti milik Anda sendiri.")
      }
      
      const prop = properties[0]
      const propertyTitle = prop.title
      const now = new Date()

      // Ambil konfigurasi sistem dinamis (kurs, persentase fee, batasan durasi menginap)
      const settings = await getSystemSettings(tx)

      // Validasi batas maksimal durasi menginap sesuai pengaturan dinamis platform & properti
      const totalNights = calculateStayNights(start, end)
      const effectiveMaxStay = prop.maxStayNights && prop.maxStayNights > 0 
        ? Math.min(prop.maxStayNights, settings.maxStayNights) 
        : settings.maxStayNights
      if (totalNights < 1 || totalNights > effectiveMaxStay) {
        throw new Error(`Durasi menginap maksimal adalah ${effectiveMaxStay} malam per transaksi`)
      }

      // Otomatis batalkan booking PENDING yang sudah melewati batas waktu (60 menit)
      await tx.booking.updateMany({
        where: {
          propertyId,
          status: 'PENDING',
          paymentStatus: 'PENDING',
          expiresAt: { lt: now }
        },
        data: {
          status: 'CANCELLED',
          paymentStatus: 'EXPIRED',
          cancelReason: 'Waktu pembayaran telah kedaluwarsa (60 menit)'
        }
      })

      // Cek apakah ada booking aktif yang masih mengunci tanggal (termasuk yang PENDING aktif < 60 menit)
      const overlappingBookings = await tx.booking.findFirst({
        where: {
          propertyId,
          status: { not: 'CANCELLED' },
          paymentStatus: { notIn: ['FAILED', 'CANCELLED', 'EXPIRED'] },
          startDate: { lt: end },
          endDate: { gt: start }
        }
      })

      if (overlappingBookings) {
        throw new Error("Dates are no longer available")
      }

      // Cek apakah ada tanggal yang diblokir oleh host (Blocked Dates)
      const overlappingBlockedDates = await tx.blockedDate.findFirst({
        where: {
          propertyId,
          startDate: { lt: end },
          endDate: { gt: start }
        }
      })

      if (overlappingBlockedDates) {
        throw new Error("Rentang tanggal yang Anda pilih mencakup tanggal yang diblokir oleh host.")
      }

      // Hitung rincian biaya IDR murni (Single Source of Truth) menggunakan kurs dinamis
      const nightlyRateIdr = prop.pricePerNight > 0 
        ? prop.pricePerNight 
        : Math.round((prop.price || 0) * settings.usdExchangeRate)

      // Split-fee Economics dinamis dari SystemSetting
      const {
        roomSubtotalIdr,
        cleaningFeeIdr,
        guestServiceFeeIdr,
        hostPlatformFeeIdr,
        totalPriceIdr,
        netHostPayoutIdr
      } = calculateBookingFinancials({
        nightlyRateIdr,
        cleaningFeeIdr: prop.cleaningFee || 0,
        totalNights,
        settings,
      })

      // Standar Waktu Indonesia (WIB): Rilis escrow 24 jam setelah jam check-in resmi (H+1 14:00 WIB)
      const escrowReleaseAt = toEscrowReleaseDateTimeWIB(start)

      const guestsCount = Number(guests) || 1

      // Batas waktu pembayaran 60 menit dari sekarang
      const expiresAt = new Date(now.getTime() + 60 * 60 * 1000)
      const midtransOrderId = `RR-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`

      // Buat data booking dengan status PENDING beserta snapshot lengkap V2
      const booking = await tx.booking.create({
        data: {
          propertyId,
          guestId: session.user!.id!,
          startDate: start,
          endDate: end,
          guestsCount,
          totalNights,
          nightlyRateIdr,
          cleaningFeeIdr,
          guestServiceFeeIdr,
          hostPlatformFeeIdr,
          totalPriceIdr,
          netHostPayoutIdr,
          escrowReleaseAt,
          // Legacy fields untuk kompatibilitas transisi
          nightlyRate: nightlyRateIdr / settings.usdExchangeRate,
          totalPrice: totalPriceIdr / settings.usdExchangeRate,
          cleaningFee: cleaningFeeIdr / settings.usdExchangeRate,
          serviceFee: guestServiceFeeIdr / settings.usdExchangeRate,
          status: 'PENDING',
          paymentStatus: 'PENDING',
          escrowStatus: 'HELD',
          midtransOrderId,
          expiresAt
        }
      })

      return { 
        booking, 
        propertyTitle, 
        roomSubtotalIdr, 
        cleaningFeeIdr, 
        guestServiceFeeIdr, 
        totalPriceIdr, 
        totalNights, 
        expiresAt,
        guestServiceFeePct: settings.guestServiceFeePct
      }
    })

    // 2. Buat Transaksi di Midtrans API (1:1 IDR murni)
    const itemDetails = [
      {
        id: `room-${propertyId.substring(0, 15)}`,
        price: newBooking.roomSubtotalIdr,
        quantity: 1,
        name: `Sewa ${newBooking.totalNights} malam: ${newBooking.propertyTitle.substring(0, 25)}`,
      },
      ...(newBooking.cleaningFeeIdr > 0 ? [{
        id: `cleaning-${propertyId.substring(0, 15)}`,
        price: newBooking.cleaningFeeIdr,
        quantity: 1,
        name: "Biaya Kebersihan",
      }] : []),
      {
        id: `service-fee`,
        price: newBooking.guestServiceFeeIdr,
        quantity: 1,
        name: `Biaya Layanan Tamu (${newBooking.guestServiceFeePct}%)`,
      }
    ]

    const parameter = {
      transaction_details: {
        order_id: newBooking.booking.id, // Gunakan ID Booking sebagai Order ID
        gross_amount: newBooking.totalPriceIdr, // 1:1 IDR murni ke Midtrans
      },
      customer_details: {
        first_name: session.user.name || "Tamu",
        email: session.user.email || "tamu@ruangrehat.com",
      },
      item_details: itemDetails
    }

    const transaction = await snap.createTransaction(parameter)
    const transactionToken = transaction.token

    // Simpan token ke database untuk referensi
    await prisma.booking.update({
      where: { id: newBooking.booking.id },
      data: { midtransToken: transactionToken }
    })
    
    return NextResponse.json({ 
      bookingId: newBooking.booking.id, 
      token: transactionToken,
      expiresAt: newBooking.expiresAt
    })

  } catch (error: any) {
    console.error("Checkout Error Log:", error);
    if (error.message === "Dates are no longer available") {
      return NextResponse.json({ error: error.message }, { status: 409 })
    }
    return NextResponse.json({ error: error.message || "Checkout failed" }, { status: 500 })
  }
}
