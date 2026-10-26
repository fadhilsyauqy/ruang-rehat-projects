import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

// Helper: Sinkronisasi dan rilis otomatis dana escrow yang telah melewati batas 24 jam check-in
async function syncReleasedEscrow(hostUserId: string) {
  const now = new Date()
  await prisma.booking.updateMany({
    where: {
      property: { hostId: hostUserId },
      paymentStatus: "PAID",
      escrowStatus: "HELD",
      status: { in: ["CONFIRMED", "COMPLETED"] },
      OR: [
        { escrowReleaseAt: { lte: now } },
        { startDate: { lte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }
      ]
    },
    data: {
      escrowStatus: "RELEASED"
    }
  })
}

// GET: Ambil daftar riwayat penarikan dana host dan ringkasan saldo
export async function GET() {
  try {
    const session = await auth()
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Jalankan auto-release escrow
    await syncReleasedEscrow(session.user.id)

    const payouts = await prisma.payout.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" }
    })

    // Denda pembatalan yang belum dipotong
    const penalties = await prisma.hostPenalty.findMany({
      where: { hostId: session.user.id, isDeducted: false }
    })
    const totalPenaltyIdr = penalties.reduce((sum, p) => sum + p.amountIdr, 0)

    // Hitung saldo tertahan (HELD) vs saldo siap ditarik (RELEASED) dalam IDR
    const heldBookings = await prisma.booking.findMany({
      where: {
        property: { hostId: session.user.id },
        paymentStatus: "PAID",
        escrowStatus: "HELD",
        status: { not: "CANCELLED" }
      }
    })
    const escrowBalanceIdr = heldBookings.reduce((sum, b) => {
      return sum + (b.netHostPayoutIdr || (b.totalPriceIdr ? Math.round(b.totalPriceIdr * 0.97) : Math.round((b.totalPrice || 0) * 18051)))
    }, 0)

    const releasedBookings = await prisma.booking.findMany({
      where: {
        property: { hostId: session.user.id },
        paymentStatus: "PAID",
        escrowStatus: "RELEASED",
        status: { not: "CANCELLED" }
      }
    })
    const totalReleasedRevenueIdr = releasedBookings.reduce((sum, b) => {
      return sum + (b.netHostPayoutIdr || (b.totalPriceIdr ? Math.round(b.totalPriceIdr * 0.97) : Math.round((b.totalPrice || 0) * 18051)))
    }, 0)

    const totalWithdrawnIdr = payouts
      .filter(p => p.status !== "FAILED")
      .reduce((sum, p) => sum + (p.amount || 0), 0)

    const availableBalanceIdr = Math.max(0, totalReleasedRevenueIdr - totalWithdrawnIdr - totalPenaltyIdr)

    return NextResponse.json({ 
      payouts,
      escrowBalanceIdr,
      availableBalanceIdr,
      totalPenaltyIdr,
      // Kompatibilitas respons lama
      escrowBalanceUSD: escrowBalanceIdr,
      availableBalanceUSD: availableBalanceIdr
    })
  } catch (error) {
    console.error("Error fetching payouts:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// POST: Request penarikan dana baru
export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { amount, notes } = await req.json()
    const withdrawAmount = Number(amount)

    if (!withdrawAmount || withdrawAmount <= 0) {
      return NextResponse.json({ error: "Nominal penarikan tidak valid" }, { status: 400 })
    }

    // 1. Cek apakah Host sudah mendaftarkan rekening bank
    const bankAccount = await prisma.hostBankAccount.findUnique({
      where: { userId: session.user.id }
    })

    if (!bankAccount) {
      return NextResponse.json(
        { error: "Silakan daftarkan rekening bank Anda terlebih dahulu sebelum menarik dana." },
        { status: 400 }
      )
    }

    // 2. Jalankan sinkronisasi escrow sebelum menghitung saldo yang dapat dicairkan
    await syncReleasedEscrow(session.user.id)

    // Denda pembatalan yang belum dipotong
    const penalties = await prisma.hostPenalty.findMany({
      where: { hostId: session.user.id, isDeducted: false }
    })
    const totalPenaltyIdr = penalties.reduce((sum, p) => sum + p.amountIdr, 0)

    // Hitung total dana berstatus RELEASED dalam IDR
    const releasedBookings = await prisma.booking.findMany({
      where: {
        property: { hostId: session.user.id },
        paymentStatus: "PAID",
        escrowStatus: "RELEASED",
        status: { not: "CANCELLED" }
      }
    })

    const totalReleasedRevenueIdr = releasedBookings.reduce((sum, b) => {
      return sum + (b.netHostPayoutIdr || (b.totalPriceIdr ? Math.round(b.totalPriceIdr * 0.97) : Math.round((b.totalPrice || 0) * 18051)))
    }, 0)

    // Hitung total penarikan yang sudah diajukan sebelumnya (tidak termasuk FAILED)
    const existingPayouts = await prisma.payout.findMany({
      where: {
        userId: session.user.id,
        status: { not: "FAILED" }
      }
    })

    const totalWithdrawnIdr = existingPayouts.reduce((sum, p) => sum + (p.amount || 0), 0)
    const availableBalanceIdr = Math.max(0, totalReleasedRevenueIdr - totalWithdrawnIdr - totalPenaltyIdr)

    if (withdrawAmount > availableBalanceIdr) {
      return NextResponse.json(
        { 
          error: `Saldo siap ditarik tidak mencukupi. Saldo tersedia: Rp ${availableBalanceIdr.toLocaleString("id-ID")}` 
        },
        { status: 400 }
      )
    }

    // 3. Jika ada penalti, tandai penalti sudah dipotong
    if (penalties.length > 0) {
      await prisma.hostPenalty.updateMany({
        where: { id: { in: penalties.map(p => p.id) } },
        data: { isDeducted: true }
      })
    }

    // 4. Catat transaksi penarikan dana dengan status PENDING (Menunggu Verifikasi Admin)
    const payout = await prisma.payout.create({
      data: {
        userId: session.user.id,
        amount: withdrawAmount,
        status: "PENDING",
        bankName: bankAccount.bankName,
        accountNumber: bankAccount.accountNumber,
        accountHolder: bankAccount.accountHolder,
        notes: notes || "Permohonan pencairan dana hasil sewa reguler (Escrow Released)",
        processedAt: null
      }
    })

    return NextResponse.json({
      message: "Permohonan penarikan dana berhasil diajukan dan sedang menunggu verifikasi admin.",
      payout,
      remainingBalanceIdr: availableBalanceIdr - withdrawAmount
    })
  } catch (error) {
    console.error("Error creating payout:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
