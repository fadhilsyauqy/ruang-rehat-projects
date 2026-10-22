import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { idCardUrl, idCardNumber, legalName, phoneNumber, address } = body

    if (!idCardUrl) {
      return NextResponse.json(
        { error: "Foto dokumen KTP / Paspor wajib diunggah." },
        { status: 400 }
      )
    }

    if (!idCardNumber || String(idCardNumber).trim().length < 6) {
      return NextResponse.json(
        { error: "Nomor identitas resmi (NIK / KTP) tidak valid (minimal 6 digit)." },
        { status: 400 }
      )
    }

    const updateData: any = {
      idCardUrl: String(idCardUrl).trim(),
      idCardNumber: String(idCardNumber).trim(),
      kycStatus: "PENDING",
      kycRejectReason: null // Reset pesan penolakan sebelumnya jika ada
    }

    if (legalName && String(legalName).trim().length > 0) {
      updateData.name = String(legalName).trim()
    }

    if (phoneNumber && String(phoneNumber).trim().length > 0) {
      updateData.phoneNumber = String(phoneNumber).trim()
    }

    if (address && String(address).trim().length > 0) {
      updateData.address = String(address).trim()
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phoneNumber: true,
        address: true,
        kycStatus: true,
        idCardUrl: true,
        idCardNumber: true,
        role: true
      }
    })

    return NextResponse.json({
      message: "Pengajuan verifikasi identitas (KYC) Anda berhasil dikirim dan sedang ditinjau oleh Admin.",
      user: updatedUser
    })
  } catch (error: any) {
    console.error("KYC Submit Error:", error)
    return NextResponse.json(
      { error: error.message || "Gagal mengajukan verifikasi KYC" },
      { status: 500 }
    )
  }
}
