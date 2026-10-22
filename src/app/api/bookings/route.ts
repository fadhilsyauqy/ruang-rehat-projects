import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { sendBookingConfirmationEmail } from "@/lib/notifications"
import { toCheckInDateTimeWIB, toCheckOutDateTimeWIB, toEscrowReleaseDateTimeWIB, calculateStayNights } from "@/lib/date-standards"

export async function POST(req: Request) {
  const session = await auth()
  
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const data = await req.json()
    const { propertyId, startDate, endDate, totalPrice } = data
    
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
      select: { hostId: true }
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

    // Interactive Transaction with row-level locking
    const newBooking = await prisma.$transaction(async (tx) => {
      // 1. Lock the property row to prevent concurrent bookings for the same property
      // We use raw query for SELECT ... FOR UPDATE
      const properties = await tx.$queryRaw<{ 
        id: string, 
        hostId: string,
        price: number,
        pricePerNight: number,
        cleaningFee: number,
        maxStayNights: number
      }[]>`
        SELECT id, "hostId", price, "pricePerNight", "cleaningFee", "maxStayNights" FROM "Property" WHERE id = ${propertyId} FOR UPDATE
      `

      if (properties.length === 0) {
        throw new Error("Property not found")
      }

      if (properties[0].hostId === session!.user!.id) {
        throw new Error("Anda tidak dapat memesan properti milik Anda sendiri.")
      }

      const totalNights = calculateStayNights(start, end)
      const maxStay = properties[0].maxStayNights || 28
      if (totalNights > maxStay) {
        throw new Error(`Batas durasi menginap maksimal adalah ${maxStay} malam per transaksi`)
      }

      // Hitung rincian V2 pure IDR
      const nightlyRateIdr = properties[0].pricePerNight > 0 
        ? properties[0].pricePerNight 
        : Math.round((properties[0].price || 0) * 18051)
      const cleaningFeeIdr = properties[0].cleaningFee || 0
      const roomSubtotalIdr = nightlyRateIdr * totalNights
      const grossStayIdr = roomSubtotalIdr + cleaningFeeIdr
      const guestServiceFeeIdr = Math.round(grossStayIdr * 0.10)
      const hostPlatformFeeIdr = Math.round(grossStayIdr * 0.03)
      const totalPriceIdr = grossStayIdr + guestServiceFeeIdr
      const netHostPayoutIdr = Math.max(0, grossStayIdr - hostPlatformFeeIdr)

      // Standar Waktu Indonesia (WIB): Rilis escrow 24 jam setelah jam check-in resmi (H+1 14:00 WIB)
      const escrowReleaseAt = toEscrowReleaseDateTimeWIB(start)

      // 2. Check for overlapping dates
      // Any booking that is NOT cancelled, and overlaps with [start, end]
      // overlap condition: existing.startDate < end AND existing.endDate > start
      const overlappingBookings = await tx.booking.findFirst({
        where: {
          propertyId,
          status: {
            not: 'CANCELLED'
          },
          AND: [
            { startDate: { lt: end } },
            { endDate: { gt: start } }
          ]
        }
      })

      if (overlappingBookings) {
        throw new Error("Dates are no longer available")
      }

      // Check for overlapping blocked dates
      const overlappingBlockedDates = await tx.blockedDate.findFirst({
        where: {
          propertyId,
          AND: [
            { startDate: { lt: end } },
            { endDate: { gt: start } }
          ]
        }
      })

      if (overlappingBlockedDates) {
        throw new Error("Rentang tanggal yang Anda pilih mencakup tanggal yang diblokir oleh host.")
      }

      // 3. Create the booking
      return await tx.booking.create({
        data: {
          propertyId,
          guestId: session!.user!.id!,
          startDate: start,
          endDate: end,
          totalNights,
          nightlyRateIdr,
          cleaningFeeIdr,
          guestServiceFeeIdr,
          hostPlatformFeeIdr,
          totalPriceIdr,
          netHostPayoutIdr,
          escrowReleaseAt,
          totalPrice: totalPriceIdr / 18051,
          nightlyRate: nightlyRateIdr / 18051,
          cleaningFee: cleaningFeeIdr / 18051,
          serviceFee: guestServiceFeeIdr / 18051,
          status: 'CONFIRMED'
        }
      })
    })

    // If CONFIRMED, trigger notification.
    if (newBooking.status === 'CONFIRMED' && session?.user?.email) {
      const property = await prisma.property.findUnique({ where: { id: propertyId } })
      if (property) {
        // Run asynchronously, fire and forget
        sendBookingConfirmationEmail(session!.user!.email!, property.title, start, end).catch(console.error)
      }
    }
    
    return NextResponse.json(newBooking)

  } catch (error: any) {
    if (error.message === "Dates are no longer available") {
      return NextResponse.json({ error: error.message }, { status: 409 })
    }
    return NextResponse.json({ error: error.message || "Failed to create booking" }, { status: 500 })
  }
}
