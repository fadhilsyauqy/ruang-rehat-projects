import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"
import { v2 as cloudinary } from "cloudinary"

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"]
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const contentType = req.headers.get("content-type") || ""
    let idCardUrl = ""
    let idCardNumber = ""
    let legalName = ""
    let phoneNumber = ""
    let address = ""

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData()
      const file = formData.get("file") as File | null
      idCardNumber = (formData.get("idCardNumber") as string) || ""
      legalName = (formData.get("legalName") as string) || ""
      phoneNumber = (formData.get("phoneNumber") as string) || ""
      address = (formData.get("address") as string) || ""
      idCardUrl = (formData.get("idCardUrl") as string) || ""

      if (file && typeof file === "object" && typeof file.arrayBuffer === "function" && file.size > 0) {
        if (!ALLOWED_MIME_TYPES.includes(file.type)) {
          return NextResponse.json(
            { error: "Format file dokumen tidak didukung. Hanya gambar bertipe JPEG, PNG, atau WebP yang diperbolehkan." },
            { status: 400 }
          )
        }

        if (file.size > MAX_FILE_SIZE) {
          return NextResponse.json(
            { error: "Ukuran file dokumen KTP melebihi batas maksimal 5 MB." },
            { status: 413 }
          )
        }

        const cloudName = process.env.CLOUDINARY_CLOUD_NAME
        const apiKey = process.env.CLOUDINARY_API_KEY
        const apiSecret = process.env.CLOUDINARY_API_SECRET

        if (!cloudName || !apiKey || !apiSecret) {
          return NextResponse.json(
            { error: "Layanan upload file sedang tidak dapat digunakan (konfigurasi server tidak lengkap)." },
            { status: 500 }
          )
        }

        cloudinary.config({
          cloud_name: cloudName,
          api_key: apiKey,
          api_secret: apiSecret,
        })

        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        const uploadResult = await new Promise<{ secure_url?: string }>((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            { folder: "ruang-rehat-kyc" },
            (error, result) => {
              if (error) reject(error)
              else if (result) resolve(result)
              else reject(new Error("Cloudinary upload returned no result"))
            }
          )
          uploadStream.end(buffer)
        })

        idCardUrl = uploadResult.secure_url || ""
      }
    } else {
      const body = await req.json()
      idCardUrl = body.idCardUrl
      idCardNumber = body.idCardNumber
      legalName = body.legalName
      phoneNumber = body.phoneNumber
      address = body.address
    }

    if (!idCardUrl || String(idCardUrl).trim().length === 0) {
      return NextResponse.json(
        { error: "Foto dokumen KTP / Paspor wajib diunggah." },
        { status: 400 }
      )
    }

    try {
      const parsedUrl = new URL(String(idCardUrl).trim())
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        return NextResponse.json(
          { error: "URL foto dokumen identitas tidak valid." },
          { status: 400 }
        )
      }
    } catch {
      return NextResponse.json(
        { error: "URL foto dokumen identitas tidak valid." },
        { status: 400 }
      )
    }

    if (!idCardNumber || String(idCardNumber).trim().length < 6) {
      return NextResponse.json(
        { error: "Nomor identitas resmi (NIK / KTP) tidak valid (minimal 6 digit)." },
        { status: 400 }
      )
    }

    const updateData: Prisma.UserUpdateInput = {
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
  } catch (error: unknown) {
    const err = error as Error
    console.error("KYC Submit Error:", err)
    return NextResponse.json(
      { error: err.message || "Gagal mengajukan verifikasi KYC" },
      { status: 500 }
    )
  }
}
