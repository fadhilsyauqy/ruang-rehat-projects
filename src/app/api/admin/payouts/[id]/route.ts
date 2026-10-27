import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { sendHostPayoutApprovedEmail } from "@/lib/notifications"

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session || !session.user || (session.user as { role?: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 })
    }

    const resolvedParams = await params
    const body = await req.json()
    const { status, notes, referenceNumber } = body

    if (!status || !["PENDING", "PROCESSING", "COMPLETED", "FAILED"].includes(status)) {
      return NextResponse.json({ error: "Invalid payout status" }, { status: 400 })
    }

    const existingPayout = await prisma.payout.findUnique({
      where: { id: resolvedParams.id },
      include: { 
        user: { 
          select: { 
            id: true, 
            name: true, 
            email: true, 
            notifyHostPayout: true 
          } 
        } 
      }
    })

    if (!existingPayout) {
      return NextResponse.json({ error: "Payout not found" }, { status: 404 })
    }

    // Lindungi status terminal COMPLETED dari pembatalan (mencegah double withdrawal)
    if (existingPayout.status === "COMPLETED") {
      return NextResponse.json(
        { error: "Pencairan dana yang telah berstatus COMPLETED tidak dapat diubah atau dibatalkan karena dana telah ditransfer ke bank host." },
        { status: 400 }
      )
    }

    // Lindungi status terminal FAILED dari persetujuan ulang
    if (existingPayout.status === "FAILED") {
      return NextResponse.json(
        { error: "Pencairan dana yang telah Ditolak (FAILED) tidak dapat diubah kembali karena dana telah otomatis dikembalikan ke saldo host. Silakan minta host untuk mengajukan permohonan baru." },
        { status: 400 }
      )
    }

    const updateData: {
      status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
      notes?: string;
      processedAt?: Date;
    } = {
      status: status as "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED"
    }

    const cleanRef = typeof referenceNumber === "string" ? referenceNumber.trim() : ""
    const cleanNotes = typeof notes === "string" ? notes.trim() : ""

    if (status === "COMPLETED" && !cleanRef) {
      return NextResponse.json(
        { error: "Nomor referensi transfer / mutasi bank wajib diisi untuk menyelesaikan pencairan dana." },
        { status: 400 }
      )
    }

    let noteContent = ""
    if (cleanRef && cleanNotes) {
      noteContent = `[No. Ref: ${cleanRef}] ${cleanNotes}`
    } else if (cleanRef) {
      noteContent = `[No. Ref: ${cleanRef}]`
    } else if (cleanNotes) {
      noteContent = cleanNotes
    }

    if (noteContent) {
      updateData.notes = existingPayout.notes 
        ? `${existingPayout.notes} | [Admin]: ${noteContent}` 
        : `[Admin]: ${noteContent}`
    }

    const processedAt = status === "COMPLETED" ? new Date() : (existingPayout.processedAt || undefined)
    if (status === "COMPLETED") {
      updateData.processedAt = processedAt
    }

    const updatedPayout = await prisma.$transaction(async (tx) => {
      const freshPayout = await tx.payout.findUnique({
        where: { id: resolvedParams.id },
        select: { status: true }
      })

      if (!freshPayout || freshPayout.status === "COMPLETED" || freshPayout.status === "FAILED") {
        throw new Error("PAYOUT_TERMINAL_STATE_LOCKED")
      }

      const payout = await tx.payout.update({
        where: { id: resolvedParams.id },
        data: updateData,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phoneNumber: true,
            }
          }
        }
      })

      // Task 5.5: Pemulihan Status Penalti saat Payout Ditolak Admin (FAILED)
      if (status === "FAILED") {
        const linkedCount = await tx.hostPenalty.count({
          where: { payoutId: existingPayout.id }
        })

        if (linkedCount > 0) {
          await tx.hostPenalty.updateMany({
            where: { payoutId: existingPayout.id },
            data: { isDeducted: false, payoutId: null }
          })
        } else {
          // Fallback riwayat lama: pulihkan penalti terpotong milik host yang diajukan sebelum/pada payout ini
          await tx.hostPenalty.updateMany({
            where: {
              hostId: existingPayout.userId,
              isDeducted: true,
              payoutId: null,
              createdAt: { lte: existingPayout.createdAt }
            },
            data: { isDeducted: false }
          })
        }
      }

      return payout
    })

    // Kirim notifikasi email ke Host jika status menjadi COMPLETED dan notifyHostPayout aktif
    if (
      status === "COMPLETED" &&
      existingPayout.user?.email &&
      existingPayout.user.notifyHostPayout !== false
    ) {
      const refToUse =
        cleanRef ||
        (cleanNotes.startsWith("REF-") ? cleanNotes : null) ||
        null

      sendHostPayoutApprovedEmail({
        hostEmail: existingPayout.user.email,
        hostName: existingPayout.user.name,
        amountIdr: existingPayout.amount,
        bankName: existingPayout.bankName,
        accountNumber: existingPayout.accountNumber,
        accountHolder: existingPayout.accountHolder,
        referenceNumber: refToUse,
        payoutId: existingPayout.id,
        processedAt: processedAt || new Date()
      }).catch((err) => {
        console.error("[sendHostPayoutApprovedEmail Error]:", err)
      })
    }

    return NextResponse.json({
      message: `Status payout #${resolvedParams.id} diubah menjadi ${status}`,
      payout: updatedPayout
    })
  } catch (error: unknown) {
    const err = error as { message?: string }
    if (err?.message === "PAYOUT_TERMINAL_STATE_LOCKED") {
      return NextResponse.json(
        { error: "Pencairan dana ini telah berstatus terminal (COMPLETED atau FAILED) dan tidak dapat diubah kembali." },
        { status: 400 }
      )
    }
    console.error("Admin Payout update error:", error)
    return NextResponse.json({ error: err?.message || "Failed to update payout status" }, { status: 500 })
  }
}
