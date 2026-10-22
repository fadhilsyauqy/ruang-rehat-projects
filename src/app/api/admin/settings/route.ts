import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

/**
 * GET: Mengambil konfigurasi parameter global sistem
 * Akses: Khusus ADMIN
 */
export async function GET() {
  try {
    const session = await auth()
    if (!session || !session.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 })
    }

    const settings = await prisma.systemSetting.upsert({
      where: { id: "global" },
      update: {},
      create: { id: "global" }
    })

    return NextResponse.json(settings)
  } catch {
    return NextResponse.json({ error: "Failed to fetch system settings" }, { status: 500 })
  }
}

/**
 * PATCH: Memperbarui parameter global sistem
 * Akses: Khusus ADMIN
 */
export async function PATCH(req: Request) {
  try {
    const session = await auth()
    if (!session || !session.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 })
    }

    const body = await req.json()
    const {
      usdExchangeRate,
      guestServiceFeePct,
      hostPlatformFeePct,
      hostCancelPenaltyIdr,
      maxStayNights
    } = body

    const numUsdRate = Number(usdExchangeRate)
    const numGuestFee = Number(guestServiceFeePct)
    const numHostFee = Number(hostPlatformFeePct)
    const numPenalty = Number(hostCancelPenaltyIdr)
    const numMaxNights = Number(maxStayNights)

    if (isNaN(numUsdRate) || numUsdRate <= 0) {
      return NextResponse.json({ error: "Kurs USD harus berupa angka positif lebih dari 0." }, { status: 400 })
    }

    if (isNaN(numGuestFee) || numGuestFee < 0 || numGuestFee > 100) {
      return NextResponse.json({ error: "Biaya layanan tamu harus antara 0% s/d 100%." }, { status: 400 })
    }

    if (isNaN(numHostFee) || numHostFee < 0 || numHostFee > 100) {
      return NextResponse.json({ error: "Biaya platform host harus antara 0% s/d 100%." }, { status: 400 })
    }

    if (isNaN(numPenalty) || numPenalty < 0) {
      return NextResponse.json({ error: "Denda pembatalan host tidak boleh negatif." }, { status: 400 })
    }

    if (isNaN(numMaxNights) || numMaxNights < 1 || numMaxNights > 365) {
      return NextResponse.json({ error: "Batas durasi menginap harus antara 1 s/d 365 malam." }, { status: 400 })
    }

    const updated = await prisma.systemSetting.upsert({
      where: { id: "global" },
      update: {
        usdExchangeRate: Math.round(numUsdRate),
        guestServiceFeePct: Number(numGuestFee.toFixed(2)),
        hostPlatformFeePct: Number(numHostFee.toFixed(2)),
        hostCancelPenaltyIdr: Math.round(numPenalty),
        maxStayNights: Math.round(numMaxNights),
      },
      create: {
        id: "global",
        usdExchangeRate: Math.round(numUsdRate),
        guestServiceFeePct: Number(numGuestFee.toFixed(2)),
        hostPlatformFeePct: Number(numHostFee.toFixed(2)),
        hostCancelPenaltyIdr: Math.round(numPenalty),
        maxStayNights: Math.round(numMaxNights),
      }
    })

    return NextResponse.json({ success: true, settings: updated })
  } catch {
    return NextResponse.json({ error: "Gagal memperbarui pengaturan sistem." }, { status: 500 })
  }
}
