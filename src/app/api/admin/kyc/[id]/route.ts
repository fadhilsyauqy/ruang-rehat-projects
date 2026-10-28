import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { KycStatus, Prisma } from "@prisma/client"

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session || !session.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 })
    }

    const resolvedParams = await params
    const { status, notes } = await req.json()

    if (!status || !["VERIFIED", "REJECTED", "PENDING", "UNVERIFIED"].includes(status)) {
      return NextResponse.json({ error: "Invalid KYC status" }, { status: 400 })
    }

    const updatedUser = await prisma.$transaction(async (tx) => {
      const targetUser = await tx.user.findUnique({
        where: { id: resolvedParams.id },
        select: {
          id: true,
          role: true,
          idCardUrl: true,
          idCardNumber: true,
          name: true,
          email: true,
          kycStatus: true
        }
      })

      if (!targetUser) {
        throw new Error("Pengguna tidak ditemukan")
      }

      if (status === "VERIFIED" && !targetUser.idCardUrl) {
        throw new Error("Tidak dapat menyetujui KYC: Dokumen identitas (KTP/Paspor) belum diunggah.")
      }

      const updateData: Prisma.UserUpdateInput = {
        kycStatus: status as KycStatus
      }

      if (status === "REJECTED") {
        updateData.kycRejectReason = notes || "Foto KTP buram atau data identitas tidak sesuai."
      } else if (status === "VERIFIED") {
        updateData.kycRejectReason = null
        // Jika akun masih GUEST, promosikan otomatis menjadi HOST setelah KYC disetujui
        if (targetUser.role === "GUEST") {
          updateData.role = "HOST"
        }
      }

      const user = await tx.user.update({
        where: { id: resolvedParams.id },
        data: updateData,
        select: {
          id: true,
          name: true,
          email: true,
          kycStatus: true,
          kycRejectReason: true,
          role: true
        }
      })

      // Jika KYC diverifikasi, verifikasi otomatis rekening bank dan PUBLIKASIKAN properti host
      if (status === "VERIFIED") {
        await tx.hostBankAccount.updateMany({
          where: { userId: resolvedParams.id },
          data: { isVerified: true }
        })
        await tx.property.updateMany({
          where: { hostId: resolvedParams.id },
          data: { isPublished: true }
        })
      } else if (status === "REJECTED") {
        // Jika KYC ditolak, unpublish properti host demi keamanan konsumen
        await tx.hostBankAccount.updateMany({
          where: { userId: resolvedParams.id },
          data: { isVerified: false }
        })
        await tx.property.updateMany({
          where: { hostId: resolvedParams.id },
          data: { isPublished: false }
        })
      }

      return user
    })

    return NextResponse.json({
      message: `Status KYC untuk ${updatedUser.name || updatedUser.email} berhasil diubah menjadi ${status}`,
      user: updatedUser,
      notes
    })
  } catch (error) {
    console.error("Admin KYC update error:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to update KYC status"
    return NextResponse.json({ error: errorMessage }, { status: 400 })
  }
}
