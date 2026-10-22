import { getWibDateString } from "@/lib/date-standards"
import type { Dictionary } from "@/lib/dictionary"
import type { HostIncomingBooking } from "@/types"

export function exportHostFinancialReportCsv({
  incomingBookings,
  currentCurrency = "IDR",
  currentLang = "id",
  t,
}: {
  incomingBookings: HostIncomingBooking[]
  currentCurrency?: string
  currentLang?: string
  t: Partial<Dictionary>
}) {
  if (!incomingBookings || incomingBookings.length === 0) {
    alert(
      t.noDataToExport ||
        (currentLang === "en"
          ? "No transaction data to export."
          : "Belum ada data transaksi untuk diekspor.")
    )
    return
  }

  const headers =
    currentLang === "en"
      ? [
          "Booking Code",
          "Booking Date",
          "Property",
          "Property Address",
          "Guest Name",
          "Guest Email",
          "Check-In",
          "Check-Out",
          "Duration (Nights)",
          "Booking Status",
          "Payment Status",
          `Total Revenue (${currentCurrency})`,
          "Cancel Reason",
        ]
      : [
          "Kode Reservasi",
          "Tanggal Pemesanan",
          "Properti",
          "Alamat Properti",
          "Nama Tamu",
          "Email Tamu",
          "Check-In",
          "Check-Out",
          "Durasi (Malam)",
          "Status Pesanan",
          "Status Pembayaran",
          `Total Pendapatan (${currentCurrency})`,
          "Alasan Batal",
        ]

  const rows = incomingBookings.map((b) => {
    const code = `RR-${b.id.slice(-8).toUpperCase()}`
    const bookingDate = new Date(b.createdAt).toLocaleDateString("id-ID")
    const title = `"${(b.property?.title || "").replace(/"/g, '""')}"`
    const address = `"${(b.property?.address || "").replace(/"/g, '""')}"`
    const guestName = `"${(b.guest?.name || "").replace(/"/g, '""')}"`
    const guestEmail = b.guest?.email || ""
    const checkIn = new Date(b.startDate).toLocaleDateString("id-ID")
    const checkOut = new Date(b.endDate).toLocaleDateString("id-ID")
    const nights = Math.max(
      1,
      Math.ceil(
        Math.abs(
          new Date(b.endDate).getTime() - new Date(b.startDate).getTime()
        ) /
          (1000 * 60 * 60 * 24)
      )
    )
    const status = b.status
    const paymentStatus = b.paymentStatus
    const revenue = b.totalPriceIdr || (b.totalPrice ? b.totalPrice * 18051 : 0)
    const cancelReason = b.cancelReason
      ? `"${b.cancelReason.replace(/"/g, '""')}"`
      : ""

    return [
      code,
      bookingDate,
      title,
      address,
      guestName,
      guestEmail,
      checkIn,
      checkOut,
      nights,
      status,
      paymentStatus,
      revenue,
      cancelReason,
    ].join(",")
  })

  const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\r\n")
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  const dateStr = getWibDateString(new Date())
  link.setAttribute("href", url)
  link.setAttribute("download", `Laporan_Keuangan_RuangRehat_${dateStr}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
