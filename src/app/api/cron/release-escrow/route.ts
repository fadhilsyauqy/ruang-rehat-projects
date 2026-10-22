import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

/**
 * Hourly Cron Worker: Otomatisasi Pelepasan Dana Escrow
 * Mencairkan dana pesanan tamu yang telah melewati masa komplain (24 jam sejak check-in)
 * dan mengabaikan pesanan yang sedang bersengketa (DISPUTED).
 */
export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization")
    const cronSecret = process.env.CRON_SECRET

    // Jika CRON_SECRET terkonfigurasi, validasi header authorization (Vercel Cron)
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const now = new Date()

    // 1. Ambil pesanan yang berhak dirilis
    const eligibleBookings = await prisma.booking.findMany({
      where: {
        status: { in: ["CONFIRMED", "COMPLETED", "PENDING"] },
        paymentStatus: "PAID",
        escrowStatus: "HELD", // DISPUTED dilewati secara otomatis
        OR: [
          { escrowReleaseAt: { lte: now } },
          // Fallback jika pesanan lama belum memiliki escrowReleaseAt: 24 jam setelah startDate
          { 
            escrowReleaseAt: null,
            startDate: { lte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
          }
        ]
      },
      select: {
        id: true,
        propertyId: true,
        totalPriceIdr: true,
        netHostPayoutIdr: true,
      }
    })

    if (eligibleBookings.length === 0) {
      return NextResponse.json({
        message: "Tidak ada dana escrow yang jatuh tempo untuk dirilis saat ini.",
        releasedCount: 0,
        timestamp: now.toISOString()
      })
    }

    const eligibleIds = eligibleBookings.map(b => b.id)

    // 2. Eksekusi pelepasan dana serentak
    const updateResult = await prisma.booking.updateMany({
      where: {
        id: { in: eligibleIds }
      },
      data: {
        escrowStatus: "RELEASED"
      }
    })

    return NextResponse.json({
      message: `Berhasil merilis ${updateResult.count} dana pesanan ke saldo Host.`,
      releasedCount: updateResult.count,
      bookingIds: eligibleIds,
      timestamp: now.toISOString()
    })
  } catch (error) {
    console.error("Cron release escrow error:", error)
    return NextResponse.json({ error: "Terjadi kesalahan saat memproses escrow" }, { status: 500 })
  }
}
