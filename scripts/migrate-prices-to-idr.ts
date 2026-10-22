import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()
const USD_TO_IDR_RATE = 18051

async function main() {
  console.log("🚀 Memulai Migrasi Data Fase 1: Standarisasi IDR Murni (Kurs 1 USD = Rp 18.051)...")

  // 1. Inisialisasi SystemSetting Global
  const setting = await prisma.systemSetting.upsert({
    where: { id: "global" },
    update: {
      usdExchangeRate: USD_TO_IDR_RATE,
      baseCurrency: "IDR",
      guestServiceFeePct: 10.0,
      hostPlatformFeePct: 3.0,
      hostCancelPenaltyIdr: 250000,
      maxStayNights: 28,
    },
    create: {
      id: "global",
      usdExchangeRate: USD_TO_IDR_RATE,
      baseCurrency: "IDR",
      guestServiceFeePct: 10.0,
      hostPlatformFeePct: 3.0,
      hostCancelPenaltyIdr: 250000,
      maxStayNights: 28,
    },
  })
  console.log("✅ SystemSetting berhasil diinisialisasi:", setting)

  // 2. Migrasi Seluruh Property ke IDR
  const properties = await prisma.property.findMany()
  console.log(`📦 Memproses ${properties.length} properti...`)

  let updatedPropertiesCount = 0
  for (const prop of properties) {
    const rawPriceUSD = prop.price || 0
    const pricePerNightIdr = Math.round(rawPriceUSD * USD_TO_IDR_RATE)
    const cleaningFeeIdr = Math.round((prop.cleaningFee || 0) * USD_TO_IDR_RATE)

    await prisma.property.update({
      where: { id: prop.id },
      data: {
        pricePerNight: pricePerNightIdr,
        cleaningFee: cleaningFeeIdr,
        maxStayNights: prop.maxStayNights || 28,
        cancellationCount: prop.cancellationCount || 0,
      },
    })
    updatedPropertiesCount++
  }
  console.log(`✅ Berhasil memperbarui ${updatedPropertiesCount} properti ke basis IDR murni.`)

  // 3. Migrasi Seluruh Booking ke Rincian IDR & Split-Fee
  const bookings = await prisma.booking.findMany()
  console.log(`📋 Memproses ${bookings.length} reservasi...`)

  let updatedBookingsCount = 0
  for (const b of bookings) {
    const start = new Date(b.startDate)
    const end = new Date(b.endDate)
    const totalNights = b.totalNights && b.totalNights > 0
      ? b.totalNights
      : Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)))

    // Hitung tarif dasar IDR
    const baseRateUSD = b.nightlyRate || (b.totalPrice ? b.totalPrice / totalNights : 0)
    const nightlyRateIdr = Math.round(baseRateUSD * USD_TO_IDR_RATE)
    const cleaningFeeIdr = Math.round((b.cleaningFee || 0) * USD_TO_IDR_RATE)
    
    // Hitung Split-Fee
    const grossStayIdr = (nightlyRateIdr * totalNights) + cleaningFeeIdr
    const guestServiceFeeIdr = Math.round(grossStayIdr * 0.10) // 10%
    const hostPlatformFeeIdr = Math.round(grossStayIdr * 0.03) // 3%
    const totalPriceIdr = grossStayIdr + guestServiceFeeIdr
    const netHostPayoutIdr = Math.max(0, grossStayIdr - hostPlatformFeeIdr)

    // Check-in jam 14:00 WIB + 24 Jam = escrow release
    const escrowReleaseAt = new Date(start.getTime() + 24 * 60 * 60 * 1000)

    // Tentukan refundAmountIdr jika booking pernah dibatalkan / refund
    let refundAmountIdr = 0
    let refundStatus = b.refundStatus || "NONE"

    if (b.paymentStatus === "REFUNDED" || b.escrowStatus === "REFUNDED_TO_GUEST") {
      refundAmountIdr = grossStayIdr // Nilai sewa yang dikembalikan ke tamu
      refundStatus = "COMPLETED"
    }

    await prisma.booking.update({
      where: { id: b.id },
      data: {
        totalNights,
        nightlyRateIdr,
        cleaningFeeIdr,
        guestServiceFeeIdr,
        hostPlatformFeeIdr,
        totalPriceIdr,
        netHostPayoutIdr,
        escrowReleaseAt,
        refundAmountIdr,
        refundStatus: refundStatus as any,
      },
    })
    updatedBookingsCount++
  }
  console.log(`✅ Berhasil memperbarui ${updatedBookingsCount} booking ke rincian IDR & Split-Fee.`)

  console.log("🎉 Migrasi Fase 1 Selesai dengan Sukses!")
}

main()
  .catch((err) => {
    console.error("❌ Gagal migrasi:", err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
