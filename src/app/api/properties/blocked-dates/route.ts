import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { Prisma } from "@prisma/client"
import { getWibDateString, toCheckInDateTimeWIB, toCheckOutDateTimeWIB, isPastDateWIB } from "@/lib/date-standards"

export async function GET(req: Request) {
  const session = await auth()
  const userRole = (session?.user as { role?: string })?.role
  if (!session || !session.user || userRole !== "HOST") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const propertyId = searchParams.get("propertyId")

  try {
    const whereClause: Prisma.BlockedDateWhereInput = {
      property: { hostId: session.user.id }
    }
    if (propertyId) {
      whereClause.propertyId = propertyId
    }

    const blockedDates = await prisma.blockedDate.findMany({
      where: whereClause,
      include: {
        property: {
          select: { id: true, title: true }
        }
      },
      orderBy: { startDate: "asc" }
    })

    return NextResponse.json(blockedDates)
  } catch {
    return NextResponse.json({ error: "Gagal mengambil tanggal blokir" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const session = await auth()
  const userRole = (session?.user as { role?: string })?.role
  if (!session || !session.user || userRole !== "HOST") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { propertyId, startDate, endDate, reason } = body

    if (!propertyId || !startDate || !endDate) {
      return NextResponse.json({ error: "Property, start date, dan end date wajib diisi." }, { status: 400 })
    }

    // Pastikan properti milik Host yang sedang login
    const property = await prisma.property.findUnique({
      where: { id: propertyId }
    })

    if (!property || property.hostId !== session.user.id) {
      return NextResponse.json({ error: "Anda tidak memiliki akses ke properti ini." }, { status: 403 })
    }

    if (isPastDateWIB(startDate)) {
      return NextResponse.json({ error: "Tanggal mulai blokir tidak boleh berada di masa lalu (WIB)." }, { status: 400 })
    }

    const startYmd = getWibDateString(startDate)
    const endYmd = getWibDateString(endDate)

    if (startYmd > endYmd) {
      return NextResponse.json({ error: "Tanggal mulai tidak boleh lebih besar dari tanggal selesai." }, { status: 400 })
    }

    const start = toCheckInDateTimeWIB(startYmd)
    let end = toCheckOutDateTimeWIB(endYmd)
    if (start >= end) {
      // Jika host memilih tanggal yang sama (misal 27 Okt s/d 27 Okt), blokir 1 malam sampai 28 Okt 12:00 WIB
      const nextDay = new Date(start.getTime() + 24 * 60 * 60 * 1000)
      end = toCheckOutDateTimeWIB(nextDay)
    }

    // Task 3.2: Validasi bentrok reservasi aktif saat host memblokir tanggal
    const conflictingBooking = await prisma.booking.findFirst({
      where: {
        propertyId,
        status: { not: "CANCELLED" },
        paymentStatus: { notIn: ["FAILED", "CANCELLED", "EXPIRED"] },
        startDate: { lt: end },
        endDate: { gt: start }
      },
      select: {
        id: true,
        startDate: true,
        endDate: true
      }
    })

    if (conflictingBooking) {
      return NextResponse.json({
        error: "Tidak dapat memblokir tanggal karena terdapat reservasi aktif tamu pada rentang tanggal tersebut."
      }, { status: 400 })
    }

    // Cegah duplikasi blokir jika rentang tanggal sudah pernah diblokir sebelumnya
    const conflictingBlocked = await prisma.blockedDate.findFirst({
      where: {
        propertyId,
        startDate: { lt: end },
        endDate: { gt: start }
      }
    })

    if (conflictingBlocked) {
      return NextResponse.json({
        error: "Rentang tanggal yang dipilih sudah pernah diblokir sebelumnya."
      }, { status: 400 })
    }

    const blocked = await prisma.blockedDate.create({
      data: {
        propertyId,
        startDate: start,
        endDate: end,
        reason: reason || "Ditutup oleh Tuan Rumah",
      }
    })

    return NextResponse.json(blocked, { status: 201 })
  } catch (error) {
    console.error("Error creating blocked date:", error)
    return NextResponse.json({ error: "Terjadi kesalahan saat memblokir tanggal" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  const session = await auth()
  const userRole = (session?.user as { role?: string })?.role

  if (!session || !session.user || (userRole !== "HOST" && userRole !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "ID blokir wajib disertakan." }, { status: 400 })
    }

    const blocked = await prisma.blockedDate.findUnique({
      where: { id },
      include: { property: true }
    })

    if (!blocked) {
      return NextResponse.json({ error: "Data tanggal blokir tidak ditemukan." }, { status: 404 })
    }

    // Hanya pemilik properti atau ADMIN yang dapat mengakses
    if (blocked.property.hostId !== session.user.id && userRole !== "ADMIN") {
      return NextResponse.json({ error: "Anda tidak memiliki akses ke properti ini." }, { status: 403 })
    }

    // Proteksi Anti-Kecurangan: Tanggal yang dikunci sistem (isSystemLocked) HANYA bisa dihapus oleh ADMIN
    if (blocked.isSystemLocked && userRole !== "ADMIN") {
      return NextResponse.json({
        error: "Tanggal ini dikunci oleh sistem akibat sanksi pembatalan sepihak dan tidak dapat dibuka kembali oleh Host."
      }, { status: 403 })
    }

    await prisma.blockedDate.delete({
      where: { id }
    })

    return NextResponse.json({ success: true, message: "Blokir tanggal berhasil dihapus." })
  } catch {
    return NextResponse.json({ error: "Gagal menghapus blokir tanggal" }, { status: 500 })
  }
}
