import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  const userRole = (session?.user as any)?.role

  if (!session || !session.user || userRole !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized. Hanya Admin yang dapat memproses resolusi sengketa." }, { status: 403 })
  }

  const resolvedParams = await params

  try {
    const body = await req.json()
    const { 
      resolution, // 'RESOLVED_RELEASE_TO_HOST' | 'RESOLVED_FULL_REFUND' | 'RESOLVED_PARTIAL_REFUND' | 'REJECTED'
      adminNotes,
      refundApprovedIdr,
      payoutApprovedIdr 
    } = body

    if (!resolution) {
      return NextResponse.json({ error: "Resolusi keputusan wajib ditentukan." }, { status: 400 })
    }

    const dispute = await prisma.dispute.findUnique({
      where: { id: resolvedParams.id },
      include: {
        booking: true
      }
    })

    if (!dispute) {
      return NextResponse.json({ error: "Data sengketa tidak ditemukan." }, { status: 404 })
    }

    const booking = dispute.booking
    const bookingTotal = booking.totalPriceIdr > 0 ? booking.totalPriceIdr : Math.round((booking.totalPrice || 0) * 18051)

    const updated = await prisma.$transaction(async (tx) => {
      let finalRefundApproved = 0
      let finalPayoutApproved = 0

      if (resolution === "RESOLVED_RELEASE_TO_HOST") {
        // Rilis 100% hak ke Host
        await tx.booking.update({
          where: { id: booking.id },
          data: {
            escrowStatus: "RELEASED",
            status: "COMPLETED",
          }
        })
      } else if (resolution === "RESOLVED_FULL_REFUND") {
        // Refund 100% penuh ke Tamu
        finalRefundApproved = bookingTotal
        await tx.booking.update({
          where: { id: booking.id },
          data: {
            escrowStatus: "REFUNDED_TO_GUEST",
            refundAmountIdr: finalRefundApproved,
            refundStatus: "PENDING_ADMIN_TRANSFER",
            status: "CANCELLED",
            paymentStatus: "REFUNDED"
          }
        })
      } else if (resolution === "RESOLVED_PARTIAL_REFUND") {
        // Bagi sebagian (Split Partial)
        finalRefundApproved = Number(refundApprovedIdr) || 0
        finalPayoutApproved = Number(payoutApprovedIdr) || 0

        await tx.booking.update({
          where: { id: booking.id },
          data: {
            escrowStatus: "RELEASED",
            refundAmountIdr: finalRefundApproved,
            refundStatus: finalRefundApproved > 0 ? "PENDING_ADMIN_TRANSFER" : "NONE",
            netHostPayoutIdr: finalPayoutApproved,
            status: "COMPLETED"
          }
        })
      } else if (resolution === "REJECTED") {
        // Komplain ditolak, rilis ke Host
        await tx.booking.update({
          where: { id: booking.id },
          data: {
            escrowStatus: "RELEASED",
            status: "COMPLETED"
          }
        })
      }

      const updatedDispute = await tx.dispute.update({
        where: { id: dispute.id },
        data: {
          status: resolution,
          adminNotes: adminNotes || null,
          refundApprovedIdr: finalRefundApproved,
          payoutApprovedIdr: finalPayoutApproved,
          resolvedAt: new Date()
        }
      })

      return updatedDispute
    })

    return NextResponse.json({
      message: "Keputusan sengketa berhasil diterapkan.",
      dispute: updated
    })
  } catch (error) {
    console.error("Resolve dispute error:", error)
    return NextResponse.json({ error: "Gagal memproses keputusan sengketa" }, { status: 500 })
  }
}
