import { NextResponse } from "next/server"
import { auth } from "@/auth"

// Aturan standar panjang digit nomor rekening perbankan di Indonesia
const BANK_RULES: Record<string, { minLength: number; maxLength: number; fullName: string }> = {
  BCA: { minLength: 10, maxLength: 10, fullName: "Bank Central Asia (BCA)" },
  Mandiri: { minLength: 13, maxLength: 13, fullName: "Bank Mandiri" },
  BNI: { minLength: 10, maxLength: 10, fullName: "Bank Negara Indonesia (BNI)" },
  BRI: { minLength: 15, maxLength: 15, fullName: "Bank Rakyat Indonesia (BRI)" },
  "CIMB Niaga": { minLength: 10, maxLength: 14, fullName: "Bank CIMB Niaga" },
  BSI: { minLength: 10, maxLength: 10, fullName: "Bank Syariah Indonesia (BSI)" },
  Permata: { minLength: 10, maxLength: 10, fullName: "Bank Permata" },
  Jago: { minLength: 10, maxLength: 12, fullName: "Bank Jago" },
}

// POST: Simulasi Bank Account Inquiry / Validasi Rekening Realistis
export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { bankName, accountNumber, accountHolder } = await req.json()

    if (!bankName || !accountNumber) {
      return NextResponse.json(
        { error: "Nama bank dan nomor rekening wajib diisi" },
        { status: 400 }
      )
    }

    const cleanNumber = String(accountNumber).replace(/\D/g, "")
    const rule = BANK_RULES[bankName]

    if (!rule) {
      return NextResponse.json(
        { error: "Bank tujuan tidak didukung oleh sistem" },
        { status: 400 }
      )
    }

    // 1. Validasi Panjang Digit Nomor Rekening Sesuai Standar Bank
    if (cleanNumber.length < rule.minLength || cleanNumber.length > rule.maxLength) {
      const digitText =
        rule.minLength === rule.maxLength
          ? `${rule.minLength} digit`
          : `${rule.minLength} - ${rule.maxLength} digit`

      return NextResponse.json(
        {
          error: `Nomor rekening ${rule.fullName} tidak valid. Nomor rekening harus terdiri dari ${digitText} angka. (Anda memasukkan ${cleanNumber.length} digit).`,
        },
        { status: 422 }
      )
    }

    // 2. Simulasi Pengecekan ke Jaringan Bank (BI-FAST / SKN)
    // Jika digit berupa angka berulang tidak wajar (misal "0000000000" atau "9999999999"), anggap tidak terdaftar
    const isRepeatedDigits = /^(\d)\1+$/.test(cleanNumber)
    if (isRepeatedDigits) {
      return NextResponse.json(
        {
          error: `Nomor rekening ${cleanNumber} tidak ditemukan di sistem ${rule.fullName} (Error: Account Not Found).`,
        },
        { status: 404 }
      )
    }

    // Nama pemilik rekening: Prioritaskan nama yang diketik oleh pengguna di formulir,
    // atau gunakan nama sesi jika kolom nama belum diisi.
    const resolvedName = (accountHolder && accountHolder.trim().length > 0)
      ? accountHolder.trim().toUpperCase()
      : (session.user.name || "PEMILIK REKENING").toUpperCase()

    return NextResponse.json({
      success: true,
      message: `Rekening terverifikasi di jaringan ${rule.fullName}`,
      data: {
        bankName,
        accountNumber: cleanNumber,
        accountHolder: resolvedName,
        inquiryRef: `INQ-${Date.now().toString(36).toUpperCase()}`,
        network: "BI-FAST Real-time",
      },
    })
  } catch (error) {
    console.error("Error inquiry bank account:", error)
    return NextResponse.json({ error: "Gagal memeriksa rekening bank" }, { status: 500 })
  }
}
