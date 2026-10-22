import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

// GET: Ambil rekening bank host yang sedang login
export async function GET() {
  try {
    const session = await auth()
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const bankAccount = await prisma.hostBankAccount.findUnique({
      where: { userId: session.user.id }
    })

    return NextResponse.json({ bankAccount })
  } catch (error) {
    console.error("Error fetching bank account:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// POST: Simpan atau update rekening bank host (Upsert)
export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { bankName, accountNumber, accountHolder } = await req.json()

    if (!bankName || !accountNumber || !accountHolder) {
      return NextResponse.json(
        { error: "Nama bank, nomor rekening, dan nama pemilik rekening wajib diisi" },
        { status: 400 }
      )
    }

    const bankAccount = await prisma.hostBankAccount.upsert({
      where: { userId: session.user.id },
      update: {
        bankName: bankName.trim(),
        accountNumber: accountNumber.trim(),
        accountHolder: accountHolder.trim()
      },
      create: {
        userId: session.user.id!,
        bankName: bankName.trim(),
        accountNumber: accountNumber.trim(),
        accountHolder: accountHolder.trim()
      }
    })

    return NextResponse.json({
      message: "Rekening bank berhasil disimpan",
      bankAccount
    })
  } catch (error) {
    console.error("Error saving bank account:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
