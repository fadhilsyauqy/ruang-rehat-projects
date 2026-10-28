import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { Prisma, RefundStatus } from "@prisma/client"

/**
 * GET: Ambil daftar seluruh antrean pengembalian dana (Refunds)
 * Akses: ADMIN
 */
export async function GET(req: Request) {
  try {
    const session = await auth()
    const userRole = session?.user?.role

    if (!session || !session.user || userRole !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized. Akses khusus Admin." }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status") // 'PENDING_ADMIN_TRANSFER' | 'COMPLETED' | 'ALL'

    const whereClause: Prisma.BookingWhereInput = {
      refundStatus: status && status !== "ALL" ? (status as RefundStatus) : { not: "NONE" }
    }

    const refunds = await prisma.booking.findMany({
      where: whereClause,
      select: {
        id: true,
        startDate: true,
        endDate: true,
        totalPriceIdr: true,
        totalPrice: true,
        cancelledByRole: true,
        cancelReason: true,
        refundAmountIdr: true,
        refundStatus: true,
        refundBankName: true,
        refundAccountNumber: true,
        refundAccountHolder: true,
        refundProofUrl: true,
        refundedAt: true,
        createdAt: true,
        guest: {
          select: { id: true, name: true, email: true, image: true }
        },
        property: {
          select: { id: true, title: true, address: true, host: { select: { id: true, name: true, email: true } } }
        }
      },
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json(refunds)
  } catch (error) {
    console.error("Fetch refunds error:", error)
    return NextResponse.json({ error: "Gagal memuat antrean refund" }, { status: 500 })
  }
}
