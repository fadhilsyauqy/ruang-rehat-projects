import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import type { DisputeStatus } from "@prisma/client"

const TERMINAL_DISPUTE_STATUSES: DisputeStatus[] = [
  "RESOLVED_RELEASE_TO_HOST",
  "RESOLVED_FULL_REFUND",
  "RESOLVED_PARTIAL_REFUND",
  "REJECTED"
]

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  const userRole = (session?.user as { role?: string })?.role

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

    if (!resolution || !TERMINAL_DISPUTE_STATUSES.includes(resolution)) {
      return NextResponse.json({ error: "Resolusi keputusan tidak valid atau belum ditentukan." }, { status: 400 })
    }

    // Jalankan seluruh validasi, perhitungan integer IDR, dan pembaruan dalam 1 transaksi atomik
    const updated = await prisma.$transaction(async (tx) => {
      const dispute = await tx.dispute.findUnique({
        where: { id: resolvedParams.id },
        include: {
          booking: true
        }
      })

      if (!dispute) {
        throw new Error("DISPUTE_NOT_FOUND")
      }

      // Task 5.4: Penguncian Status Terminal Sengketa (Terminal State Lock)
      // Cegah eksekusi ulang keputusan pada sengketa yang sudah berstatus final
      if (TERMINAL_DISPUTE_STATUSES.includes(dispute.status)) {
        throw new Error("DISPUTE_ALREADY_RESOLVED")
      }

      const booking = dispute.booking
      if (!booking) {
        throw new Error("BOOKING_NOT_FOUND")
      }

      // Hitung total booking murni IDR integer
      const bookingTotal = booking.totalPriceIdr > 0 
        ? Math.round(booking.totalPriceIdr) 
        : Math.round((booking.totalPrice || 0) * 18051)

      let finalRefundApproved = 0
      let finalPayoutApproved = 0

      if (resolution === "RESOLVED_RELEASE_TO_HOST") {
        // Rilis 100% hak ke Host
        finalRefundApproved = 0
        finalPayoutApproved = booking.netHostPayoutIdr > 0 
          ? booking.netHostPayoutIdr 
          : Math.round(bookingTotal * 0.97)

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
        finalPayoutApproved = 0

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
        // Task 5.3: Bagi sebagian (Split Partial) dengan validasi integer murni IDR
        const rawRefund = Number(refundApprovedIdr)
        const rawPayout = Number(payoutApprovedIdr)

        if (isNaN(rawRefund) || isNaN(rawPayout) || rawRefund < 0 || rawPayout < 0) {
          throw new Error("INVALID_PARTIAL_AMOUNTS")
        }

        finalRefundApproved = Math.round(rawRefund)
        finalPayoutApproved = Math.round(rawPayout)

        // Validasi batasan finansial: finalRefundApproved + finalPayoutApproved <= bookingTotal
        if (finalRefundApproved + finalPayoutApproved > bookingTotal) {
          throw new Error(`PARTIAL_EXCEEDS_TOTAL:${finalRefundApproved + finalPayoutApproved}:${bookingTotal}`)
        }

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
        // Komplain ditolak, rilis hak dana ke Host
        finalRefundApproved = 0
        finalPayoutApproved = booking.netHostPayoutIdr > 0 
          ? booking.netHostPayoutIdr 
          : Math.round(bookingTotal * 0.97)

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
          status: resolution as DisputeStatus,
          adminNotes: adminNotes ? String(adminNotes).trim() : null,
          refundApprovedIdr: finalRefundApproved,
          payoutApprovedIdr: finalPayoutApproved,
          resolvedByAdminId: session.user?.id || null,
          resolvedAt: new Date()
        }
      })

      return updatedDispute
    })

    return NextResponse.json({
      message: "Keputusan sengketa berhasil diterapkan secara atomik.",
      dispute: updated
    })
  } catch (error: unknown) {
    const err = error as { message?: string }
    if (err?.message === "DISPUTE_NOT_FOUND") {
      return NextResponse.json({ error: "Data sengketa tidak ditemukan." }, { status: 404 })
    }
    if (err?.message === "BOOKING_NOT_FOUND") {
      return NextResponse.json({ error: "Data pesanan untuk sengketa ini tidak ditemukan." }, { status: 404 })
    }
    if (err?.message === "DISPUTE_ALREADY_RESOLVED") {
      return NextResponse.json({ 
        error: "Sengketa ini sudah berstatus final (sudah diputuskan/ditolak) dan tidak dapat dieksekusi ulang." 
      }, { status: 400 })
    }
    if (err?.message === "INVALID_PARTIAL_AMOUNTS") {
      return NextResponse.json({ 
        error: "Nominal refund dan payout harus berupa bilangan bulat positif yang valid." 
      }, { status: 400 })
    }
    if (typeof err?.message === "string" && err.message.startsWith("PARTIAL_EXCEEDS_TOTAL")) {
      const parts = err.message.split(":")
      return NextResponse.json({ 
        error: `Total alokasi pembagian (Rp ${Number(parts[1]).toLocaleString("id-ID")}) melebihi nilai transaksi pesanan (Rp ${Number(parts[2]).toLocaleString("id-ID")}).` 
      }, { status: 400 })
    }

    console.error("Resolve dispute error:", error)
    return NextResponse.json({ error: "Gagal memproses keputusan sengketa" }, { status: 500 })
  }
}
