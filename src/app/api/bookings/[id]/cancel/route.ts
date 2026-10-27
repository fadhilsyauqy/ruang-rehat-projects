import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { toCheckInDateTimeWIB } from "@/lib/date-standards"

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  
  const resolvedParams = await params
  const body = await req.json().catch(() => ({}))
  const { 
    cancelReason,
    refundBankName,
    refundAccountNumber,
    refundAccountHolder
  } = body

  try {
    const booking = await prisma.booking.findUnique({
      where: { id: resolvedParams.id },
      include: { 
        property: {
          select: {
            id: true,
            title: true,
            hostId: true,
            cancellationPolicy: true,
            cancellationCount: true,
          }
        } 
      }
    })

    if (!booking) {
      return NextResponse.json({ error: "Pesanan tidak ditemukan" }, { status: 404 })
    }

    const isGuest = booking.guestId === session.user.id
    const isHost = booking.property.hostId === session.user.id
    const isAdmin = (session.user as { role?: string }).role === "ADMIN"

    if (!isGuest && !isHost && !isAdmin) {
      return NextResponse.json({ error: "Anda tidak memiliki hak untuk membatalkan pesanan ini." }, { status: 403 })
    }

    if (booking.status === "CANCELLED" || booking.status === "COMPLETED") {
      return NextResponse.json({ error: "Pesanan tidak dapat dibatalkan pada status saat ini." }, { status: 400 })
    }

    // Task 5.1: Kunci Pembatalan Pesanan saat Booking Berstatus Sengketa (DISPUTED)
    if (booking.status === "DISPUTED" || booking.escrowStatus === "DISPUTED") {
      return NextResponse.json({
        error: "Pesanan ini sedang dalam proses sengketa (Dispute). Seluruh alur pengembalian atau pelepasan dana wajib diselesaikan melalui keputusan Admin di portal sengketa."
      }, { status: 400 })
    }

    // Task 5.2: Kunci Pembatalan Pesanan jika Escrow Sudah Dirilis (RELEASED)
    if (booking.escrowStatus === "RELEASED") {
      return NextResponse.json({
        error: "Dana escrow untuk pesanan ini telah dirilis ke Tuan Rumah (Escrow Released). Pesanan tidak dapat dibatalkan secara otomatis. Silakan hubungi layanan bantuan atau ajukan sengketa melalui Pusat Resolusi."
      }, { status: 400 })
    }

    const cancelledByRole = isGuest ? "GUEST" : isHost ? "HOST" : "SYSTEM"
    const now = Date.now()

    // Jam check-in standar: 14:00 WIB (07:00 UTC) pada hari H
    const checkInDateTime = toCheckInDateTimeWIB(booking.startDate)
    const checkInTime = checkInDateTime.getTime()
    const hoursUntilCheckIn = (checkInTime - now) / (1000 * 60 * 60)
    const daysUntilCheckIn = hoursUntilCheckIn / 24

    // Hitung komponen harga murni IDR
    const totalPriceIdr = booking.totalPriceIdr > 0 
      ? booking.totalPriceIdr 
      : Math.round((booking.totalPrice || 0) * 18051)

    const guestServiceFeeIdr = booking.guestServiceFeeIdr > 0
      ? booking.guestServiceFeeIdr
      : Math.round(totalPriceIdr * 0.10)

    const grossStayIdr = Math.max(0, totalPriceIdr - guestServiceFeeIdr)

    let refundPercentage = 0
    let refundAmountIdr = 0
    let newPaymentStatus: "CANCELLED" | "REFUNDED" | "PAID" = "CANCELLED"
    let newEscrowStatus: "HELD" | "RELEASED" | "REFUNDED_TO_GUEST" | "DISPUTED" = "HELD"
    let newRefundStatus: "NONE" | "PENDING_ADMIN_TRANSFER" | "COMPLETED" | "REJECTED" = "NONE"
    let policyNote = ""

    // =========================================================================
    // SKENARIO 1: Booking Berstatus PAID (Sudah Melakukan Pembayaran)
    // =========================================================================
    if (booking.paymentStatus === "PAID") {
      if (isHost) {
        // SKENARIO B: Pembatalan Sepihak oleh HOST
        // 1. Refund 100% PENUH ke tamu termasuk guest service fee
        refundPercentage = 100
        refundAmountIdr = totalPriceIdr
        newPaymentStatus = "REFUNDED"
        newEscrowStatus = "REFUNDED_TO_GUEST"
        newRefundStatus = "PENDING_ADMIN_TRANSFER"
        policyNote = "Dibatalkan sepihak oleh Tuan Rumah (Host). Pengembalian dana 100% penuh untuk tamu (termasuk biaya layanan)."
      } else {
        // SKENARIO A: Pembatalan oleh TAMU (GUEST)
        // Proteksi: Tamu tidak dapat membatalkan jika waktu check-in sudah tiba / terlewat
        if (hoursUntilCheckIn <= 0) {
          return NextResponse.json({
            error: "Pesanan tidak dapat dibatalkan karena jadwal check-in telah tiba atau telah lewat."
          }, { status: 400 })
        }

        const policy = booking.property.cancellationPolicy || "FLEXIBLE"

        if (policy === "FLEXIBLE") {
          if (hoursUntilCheckIn >= 24) {
            refundPercentage = 100
            policyNote = "Kebijakan FLEXIBLE: Dibatalkan lebih dari 24 jam sebelum check-in (Refund 100% biaya sewa)."
          } else {
            refundPercentage = 50
            policyNote = "Kebijakan FLEXIBLE: Dibatalkan kurang dari 24 jam sebelum check-in (Refund 50% biaya sewa)."
          }
        } else if (policy === "MODERATE") {
          if (daysUntilCheckIn >= 5) {
            refundPercentage = 100
            policyNote = "Kebijakan MODERATE: Dibatalkan lebih dari 5 hari sebelum check-in (Refund 100% biaya sewa)."
          } else {
            refundPercentage = 50
            policyNote = "Kebijakan MODERATE: Dibatalkan kurang dari 5 hari sebelum check-in (Refund 50% biaya sewa)."
          }
        } else if (policy === "STRICT") {
          if (daysUntilCheckIn >= 7) {
            refundPercentage = 50
            policyNote = "Kebijakan STRICT: Dibatalkan lebih dari 7 hari sebelum check-in (Refund 50% biaya sewa)."
          } else {
            refundPercentage = 0
            policyNote = "Kebijakan STRICT: Dibatalkan kurang dari 7 hari sebelum check-in (Non-refundable / Refund 0%)."
          }
        }

        // Aturan Non-Refundable Service Fee:
        // Guest service fee tidak dikembalikan jika dibatalkan oleh tamu
        refundAmountIdr = Math.round(grossStayIdr * (refundPercentage / 100))

        if (refundAmountIdr > 0) {
          // Validasi wajib menyertakan detail rekening bank tujuan refund
          if (!refundBankName || !refundAccountNumber || !refundAccountHolder) {
            return NextResponse.json({
              error: "Mohon lengkapi nama bank, nomor rekening, dan nama pemilik rekening untuk pengembalian dana (refund).",
              requiresBankDetails: true,
              eligibleRefundAmountIdr: refundAmountIdr,
              refundPercentage,
              grossStayIdr,
              guestServiceFeeIdr
            }, { status: 400 })
          }

          newPaymentStatus = "REFUNDED"
          newEscrowStatus = "REFUNDED_TO_GUEST"
          newRefundStatus = "PENDING_ADMIN_TRANSFER"
        } else {
          // Non-refundable: Hak dana sewa diteruskan ke Host
          newPaymentStatus = "PAID"
          newEscrowStatus = "RELEASED"
          newRefundStatus = "NONE"
        }
      }
    } else {
      // =========================================================================
      // SKENARIO 2: Booking Belum Dibayar (PENDING)
      // =========================================================================
      newPaymentStatus = "CANCELLED"
      newEscrowStatus = "HELD"
      newRefundStatus = "NONE"
      refundAmountIdr = 0
      policyNote = "Pesanan dibatalkan sebelum pembayaran selesai."
    }

    const fullCancelReason = cancelReason 
      ? `${cancelReason} | ${policyNote}` 
      : policyNote

    // Jalankan seluruh mutasi dalam Database Transaction atomik
    const result = await prisma.$transaction(async (tx) => {
      // Re-verifikasi status saat ini di dalam transaksi untuk mencegah race condition
      const freshBooking = await tx.booking.findUnique({
        where: { id: booking.id },
        select: { status: true, escrowStatus: true, paymentStatus: true }
      })

      if (
        !freshBooking ||
        freshBooking.status === "CANCELLED" ||
        freshBooking.status === "COMPLETED" ||
        freshBooking.status === "DISPUTED" ||
        freshBooking.escrowStatus === "DISPUTED" ||
        freshBooking.escrowStatus === "RELEASED"
      ) {
        throw new Error("BOOKING_STATUS_LOCKED")
      }

      // 1. Perbarui status pesanan booking
      const updatedBooking = await tx.booking.update({
        where: { id: booking.id },
        data: {
          status: "CANCELLED",
          paymentStatus: newPaymentStatus,
          escrowStatus: newEscrowStatus,
          cancelledByRole,
          cancelReason: fullCancelReason,
          refundAmountIdr,
          refundStatus: newRefundStatus,
          refundBankName: refundBankName || null,
          refundAccountNumber: refundAccountNumber || null,
          refundAccountHolder: refundAccountHolder || null,
        }
      })

      // 2. Jika dibatalkan sepihak oleh HOST pada pesanan yang sudah dibayar (CONFIRMED/PAID):
      if (isHost && booking.paymentStatus === "PAID") {
        // A. Kunci kalender permanen (isSystemLocked: true) agar host tidak bisa menjual offline
        await tx.blockedDate.create({
          data: {
            propertyId: booking.propertyId,
            startDate: booking.startDate,
            endDate: booking.endDate,
            reason: `Diblokir Sistem: Pembatalan sepihak oleh Host (Booking #${booking.id.slice(-8).toUpperCase()})`,
            isSystemLocked: true,
          }
        })

        // B. Tambahkan sanksi pembatalan pada properti
        await tx.property.update({
          where: { id: booking.propertyId },
          data: {
            cancellationCount: { increment: 1 }
          }
        })

        // C. Buat penalti finansial Rp 250.000 untuk memotong payout berikutnya
        await tx.hostPenalty.create({
          data: {
            hostId: booking.property.hostId,
            bookingId: booking.id,
            amountIdr: 250000,
            reason: `Penalti pembatalan sepihak pesanan #${booking.id.slice(-8).toUpperCase()} (${booking.property.title})`,
            isDeducted: false,
          }
        })
      }

      return updatedBooking
    })

    return NextResponse.json({
      message: "Pesanan berhasil dibatalkan.",
      booking: result,
      refundAmountIdr,
      refundPercentage,
      policyNote
    })
  } catch (error: unknown) {
    const err = error as { message?: string }
    if (err?.message === "BOOKING_STATUS_LOCKED") {
      return NextResponse.json(
        { error: "Pesanan tidak dapat dibatalkan karena status telah terkunci (sedang bersengketa, dana telah dirilis, atau telah selesai/dibatalkan)." },
        { status: 400 }
      )
    }
    console.error("Cancel Booking Error:", error)
    return NextResponse.json({ error: "Terjadi kesalahan saat membatalkan pesanan" }, { status: 500 })
  }
}
