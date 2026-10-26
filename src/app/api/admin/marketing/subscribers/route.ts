import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { getWibDateString } from "@/lib/date-standards"

/**
 * GET: Mengambil daftar pengguna yang mengaktifkan notifikasi promo & marketing (notifyPromoMarketing: true)
 * Akses: Khusus ADMIN
 * Format yang didukung:
 * - JSON (default): /api/admin/marketing/subscribers
 * - CSV: /api/admin/marketing/subscribers?format=csv
 */
export async function GET(req: Request) {
  try {
    const session = await auth()
    const userRole = (session?.user as { role?: string } | undefined)?.role
    if (!session?.user || userRole !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const format = searchParams.get("format")

    const subscribers = await prisma.user.findMany({
      where: { notifyPromoMarketing: true },
      select: {
        id: true,
        name: true,
        email: true,
        phoneNumber: true,
        role: true,
        kycStatus: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
    })

    if (format === "csv") {
      const headers = [
        "ID Pengguna",
        "Nama",
        "Email",
        "Nomor Telepon",
        "Role",
        "Status KYC",
        "Tanggal Terdaftar",
        "Status Notifikasi Promo",
      ]

      const rows = subscribers.map((u) => {
        const id = u.id
        const name = `"${(u.name || "Tanpa Nama").replace(/"/g, '""')}"`
        const email = u.email || ""
        const phone = u.phoneNumber ? `"${u.phoneNumber.replace(/"/g, '""')}"` : "-"
        const role = u.role
        const kycStatus = u.kycStatus
        const createdAt = getWibDateString(u.createdAt)
        const promoStatus = "Opt-in (Aktif)"

        return [id, name, email, phone, role, kycStatus, createdAt, promoStatus].join(",")
      })

      const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\r\n")
      const dateStr = getWibDateString(new Date())
      const filename = `Subscriber_Promo_RuangRehat_${dateStr}.csv`

      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Cache-Control": "no-store, max-age=0",
        },
      })
    }

    return NextResponse.json({
      count: subscribers.length,
      subscribers,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch marketing subscribers"
    console.error("Admin Marketing Subscribers error:", error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
