import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { toCheckInDateTimeWIB, toEscrowReleaseDateTimeWIB } from "@/lib/date-standards"

/**
 * GET: Ambil daftar sengketa
 * - ADMIN: Dapat melihat semua sengketa
 * - GUEST / HOST: Hanya melihat sengketa yang relevan dengan akun mereka
 */
export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userRole = (session.user as any).role
    const { searchParams } = new URL(req.url)
    const statusParam = searchParams.get("status")

    let whereClause: any = {}

    if (userRole === "ADMIN") {
      if (statusParam) {
        whereClause.status = statusParam
      }
    } else {
      whereClause.OR = [
        { reporterId: session.user.id },
        { booking: { property: { hostId: session.user.id } } }
      ]
      if (statusParam) {
        whereClause.status = statusParam
      }
    }

    const disputes = await prisma.dispute.findMany({
      where: whereClause,
      include: {
        booking: {
          include: {
            property: {
              select: { id: true, title: true, address: true, hostId: true }
            },
            guest: {
              select: { id: true, name: true, email: true, image: true }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json(disputes)
  } catch (error) {
    console.error("Fetch disputes error:", error)
    return NextResponse.json({ error: "Gagal memuat data sengketa" }, { status: 500 })
  }
}

/**
 * POST: Pengajuan Sengketa / Komplain oleh Tamu (GUEST)
 * Hanya dapat diajukan dalam rentang 24 jam pertama sejak jadwal check-in (14:00 WIB)
 */
export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { bookingId, reason, description, evidenceUrls } = body

    if (!bookingId || !reason || !description) {
      return NextResponse.json({ error: "Booking ID, alasan, dan deskripsi keluhan wajib diisi." }, { status: 400 })
    }

    // 1. Ambil data pesanan
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { property: true }
    })

    if (!booking) {
      return NextResponse.json({ error: "Pesanan tidak ditemukan." }, { status: 404 })
    }

    // Hanya tamu pemesan yang berhak mengajukan
    if (booking.guestId !== session.user.id) {
      return NextResponse.json({ error: "Anda tidak memiliki hak untuk mengajukan komplain pada pesanan ini." }, { status: 403 })
    }

    if (booking.paymentStatus !== "PAID" || booking.status !== "CONFIRMED") {
      return NextResponse.json({ error: "Komplain hanya dapat diajukan untuk pesanan berbayar yang telah terkonfirmasi." }, { status: 400 })
    }

    if (booking.escrowStatus === "DISPUTED") {
      return NextResponse.json({ error: "Pesanan ini sudah dalam proses sengketa aktif." }, { status: 400 })
    }

    if (booking.escrowStatus === "RELEASED") {
      return NextResponse.json({ error: "Masa garansi komplain (24 jam check-in) telah kedaluwarsa dan dana telah dirilis ke Host." }, { status: 400 })
    }

    // 2. Validasi Jendela Waktu Komplain (Check-in 14:00 WIB s/d escrowReleaseAt)
    const now = new Date()
    const checkInDateTime = toCheckInDateTimeWIB(booking.startDate)
    const deadline = booking.escrowReleaseAt || toEscrowReleaseDateTimeWIB(booking.startDate)

    if (now < checkInDateTime) {
      return NextResponse.json({
        error: "Pengajuan sengketa hanya dapat dilakukan setelah waktu check-in tiba (pukul 14:00 WIB)."
      }, { status: 400 })
    }

    if (now > deadline) {
      return NextResponse.json({
        error: "Batas waktu pengajuan garansi sengketa (24 jam sejak check-in) telah berakhir."
      }, { status: 400 })
    }

    // Cek apakah sudah ada sengketa tersimpan
    const existingDispute = await prisma.dispute.findUnique({
      where: { bookingId }
    })

    if (existingDispute) {
      return NextResponse.json({ error: "Sengketa untuk pesanan ini sudah pernah didaftarkan." }, { status: 400 })
    }

    // 3. Simpan sengketa dan kunci status escrow menjadi DISPUTED
    const createdDispute = await prisma.$transaction(async (tx) => {
      const dispute = await tx.dispute.create({
        data: {
          bookingId,
          reporterId: session.user!.id!,
          reasonCategory: reason,
          description,
          evidenceUrls: Array.isArray(evidenceUrls) ? evidenceUrls : [],
          status: "OPEN"
        }
      })

      await tx.booking.update({
        where: { id: bookingId },
        data: {
          escrowStatus: "DISPUTED"
        }
      })

      return dispute
    })

    return NextResponse.json({
      message: "Laporan sengketa berhasil diajukan. Penyaluran dana escrow ke Host ditangguhkan sementara hingga keputusan Admin.",
      dispute: createdDispute
    }, { status: 201 })
  } catch (error) {
    console.error("Create dispute error:", error)
    return NextResponse.json({ error: "Gagal mengajukan laporan sengketa" }, { status: 500 })
  }
}
