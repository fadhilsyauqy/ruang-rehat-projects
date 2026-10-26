/**
 * Standar Waktu & Ketentuan Operasional Ruang Rehat (Zona Waktu Indonesia Barat - WIB / UTC+7)
 * 
 * - Jam Standar Check-in : 14:00 WIB (07:00:00 UTC)
 * - Jam Standar Check-out: 12:00 WIB (05:00:00 UTC)
 * - Waktu Pembersihan   : 2 Jam (antara 12:00 WIB s/d 14:00 WIB)
 * - Garansi Sengketa    : 24 Jam sejak jam check-in resmi (H+1 14:00 WIB)
 */

export const TIMEZONE_INDONESIA = "Asia/Jakarta"

/**
 * Mengambil komponen tanggal YYYY-MM-DD dalam zona waktu Indonesia (WIB)
 */
export function getWibDateString(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: TIMEZONE_INDONESIA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  })
  const parts = formatter.formatToParts(d)
  const year = parts.find(p => p.type === "year")?.value || "1970"
  const month = parts.find(p => p.type === "month")?.value || "01"
  const day = parts.find(p => p.type === "day")?.value || "01"
  return `${year}-${month}-${day}`
}

/**
 * Memeriksa apakah tanggal yang diberikan berada di masa lalu (sebelum hari ini dalam kalender WIB)
 */
export function isPastDateWIB(date: Date | string): boolean {
  const targetYmd = getWibDateString(date)
  const todayYmd = getWibDateString(new Date())
  return targetYmd < todayYmd
}

/**
 * Menetapkan waktu check-in resmi: Pukul 14:00 WIB (07:00:00.000 UTC)
 */
export function toCheckInDateTimeWIB(date: Date | string): Date {
  const ymd = getWibDateString(date)
  return new Date(`${ymd}T07:00:00.000Z`)
}

/**
 * Menetapkan waktu check-out resmi: Pukul 12:00 WIB (05:00:00.000 UTC)
 */
export function toCheckOutDateTimeWIB(date: Date | string): Date {
  const ymd = getWibDateString(date)
  return new Date(`${ymd}T05:00:00.000Z`)
}

/**
 * Menetapkan waktu rilis escrow resmi: 24 jam setelah check-in resmi (14:00 WIB hari berikutnya)
 */
export function toEscrowReleaseDateTimeWIB(checkInDate: Date | string): Date {
  const checkIn = toCheckInDateTimeWIB(checkInDate)
  return new Date(checkIn.getTime() + 24 * 60 * 60 * 1000)
}

/**
 * Menghitung jumlah malam menginap berdasarkan selisih tanggal kalender di WIB
 */
export function calculateStayNights(startDate: Date | string, endDate: Date | string): number {
  const start = toCheckInDateTimeWIB(startDate)
  const end = toCheckOutDateTimeWIB(endDate)
  const diffMs = end.getTime() - start.getTime()
  return Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)))
}

/**
 * Memeriksa apakah tamu saat ini sedang dalam periode menginap resmi (Check-in 14:00 WIB s/d Check-out 12:00 WIB)
 */
export function isStayOngoing(
  startDate: Date | string,
  endDate: Date | string,
  status: string,
  paymentStatus: string,
  now = new Date()
): boolean {
  if (status !== "CONFIRMED" || paymentStatus !== "PAID") return false
  const checkIn = toCheckInDateTimeWIB(startDate)
  const checkOut = toCheckOutDateTimeWIB(endDate)
  return now.getTime() >= checkIn.getTime() && now.getTime() < checkOut.getTime()
}

/**
 * Format tanggal dalam zona waktu Indonesia (WIB)
 */
export function formatWibDate(date: Date | string, locale: "id" | "en" = "id"): string {
  const d = typeof date === "string" ? new Date(date) : date
  return d.toLocaleDateString(locale === "en" ? "en-US" : "id-ID", {
    timeZone: TIMEZONE_INDONESIA,
    day: "numeric",
    month: "short",
    year: "numeric"
  })
}

/**
 * Format tanggal dan jam lengkap dalam zona waktu Indonesia (WIB)
 */
export function formatWibDateTime(date: Date | string, locale: "id" | "en" = "id"): string {
  const d = typeof date === "string" ? new Date(date) : date
  return d.toLocaleString(locale === "en" ? "en-US" : "id-ID", {
    timeZone: TIMEZONE_INDONESIA,
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }) + " WIB"
}

/**
 * Format ringkasan check-in (14:00 WIB)
 */
export function formatWibCheckIn(date: Date | string, locale: "id" | "en" = "id"): string {
  const d = toCheckInDateTimeWIB(date)
  return `${formatWibDate(d, locale)} (14:00 WIB)`
}
