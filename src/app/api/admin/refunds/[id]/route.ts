import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

/**
 * PATCH: Konfirmasi transfer manual pengembalian dana tamu (BI-FAST)
 * Akses: ADMIN
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  const userRole = session?.user?.role

  if (!session || !session.user || userRole !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized. Akses khusus Admin." }, { status: 403 })
  }

  const resolvedParams = await params

  try {
    const body = await req.json()
    const { refundProofUrl, status = "COMPLETED" } = body

    const booking = await prisma.booking.findUnique({
      where: { id: resolvedParams.id }
    })

    if (!booking) {
      return NextResponse.json({ error: "Data booking tidak ditemukan." }, { status: 404 })
    }

    if (booking.refundStatus !== "PENDING_ADMIN_TRANSFER" && status === "COMPLETED") {
      return NextResponse.json({ error: "Pengembalian dana untuk pesanan ini tidak berstatus PENDING_ADMIN_TRANSFER." }, { status: 400 })
    }

    const updated = await prisma.booking.update({
      where: { id: resolvedParams.id },
      data: {
        refundStatus: status,
        refundProofUrl: refundProofUrl || null,
        refundedAt: status === "COMPLETED" ? new Date() : null
      }
    })

    return NextResponse.json({
      message: status === "COMPLETED" 
        ? "Pengembalian dana berhasil ditandai telah ditransfer ke rekening tamu." 
        : `Status refund diperbarui menjadi ${status}.`,
      booking: updated
    })
  } catch (error) {
    console.error("Update refund status error:", error)
    return NextResponse.json({ error: "Gagal memperbarui status refund" }, { status: 500 })
  }
}
