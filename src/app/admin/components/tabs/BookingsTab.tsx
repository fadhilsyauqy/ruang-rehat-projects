import React, { useState } from "react"
import Link from "next/link"
import { Search, ShieldAlert, Phone, MapPin } from "lucide-react"
import { Input } from "@/components/ui/input"
import { formatPrice } from "@/lib/format"
import { formatWibDate } from "@/lib/date-standards"
import { cn } from "@/lib/utils"
import type { AdminBookingItem } from "@/types"

export interface BookingsTabProps {
  initialBookings: AdminBookingItem[]
  currentCurrency?: string
  currentLang?: string
}

export default function BookingsTab({
  initialBookings,
  currentCurrency = "IDR",
  currentLang = "id",
}: BookingsTabProps) {
  const [userSearch, setUserSearch] = useState("")
  const [bookingStatusFilter, setBookingStatusFilter] = useState("ALL")

  const getBookingTotalIdr = (b: AdminBookingItem) =>
    (b.totalPriceIdr ?? 0) > 0
      ? (b.totalPriceIdr ?? 0)
      : b.totalPrice
      ? Math.round(b.totalPrice * 18051)
      : 0

  const filteredBookings = initialBookings.filter((b) => {
    if (bookingStatusFilter !== "ALL" && b.paymentStatus !== bookingStatusFilter)
      return false
    const q = userSearch.toLowerCase()
    return (
      b.id?.toLowerCase().includes(q) ||
      b.property?.title?.toLowerCase().includes(q) ||
      b.guest?.name?.toLowerCase().includes(q) ||
      b.guest?.email?.toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white dark:bg-gray-900 p-4 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Cari ID booking, properti, tamu..."
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            className="pl-9 rounded-2xl text-xs"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-muted-foreground shrink-0">
            Status Bayar:
          </span>
          <select
            value={bookingStatusFilter}
            onChange={(e) => setBookingStatusFilter(e.target.value)}
            className="h-9 px-3 rounded-xl border border-gray-200 dark:border-gray-800 text-xs bg-white dark:bg-gray-900 font-medium cursor-pointer"
          >
            <option value="ALL">Semua Status</option>
            <option value="PAID">PAID (Sudah Dibayar)</option>
            <option value="PENDING">PENDING (Menunggu Bayar)</option>
            <option value="CANCELLED">CANCELLED (Dibatalkan)</option>
            <option value="REFUNDED">REFUNDED (Dikembalikan)</option>
            <option value="EXPIRED">EXPIRED (Kedaluwarsa 60 Menit)</option>
          </select>
        </div>
      </div>

      {/* Bookings Table / Cards */}
      <div className="space-y-4">
        {filteredBookings.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 text-muted-foreground text-xs">
            Tidak ada data pemesanan sesuai filter.
          </div>
        ) : (
          filteredBookings.map((b) => {
            const bookingTotal = getBookingTotalIdr(b)
            const nightlyRate =
              b.nightlyRateIdr ||
              (b.nightlyRate
                ? Math.round(b.nightlyRate * 18051)
                : Math.round(bookingTotal / (b.totalNights || 1)))

            return (
              <div
                key={b.id}
                className="p-5 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xs hover:shadow-md transition-all space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-mono text-xs font-bold text-gray-500">
                      #{b.id.substring(0, 10)}
                    </span>
                    <span
                      className={cn(
                        "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase",
                        b.paymentStatus === "PAID"
                          ? "bg-emerald-100 text-emerald-800"
                          : b.paymentStatus === "CANCELLED"
                          ? "bg-rose-100 text-rose-800"
                          : b.paymentStatus === "REFUNDED"
                          ? "bg-purple-100 text-purple-800"
                          : b.paymentStatus === "EXPIRED"
                          ? "bg-gray-100 text-gray-800"
                          : "bg-amber-100 text-amber-800"
                      )}
                    >
                      {b.paymentStatus}
                    </span>
                    {b.paymentStatus === "PAID" && (
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border",
                          b.escrowStatus === "RELEASED"
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : b.escrowStatus === "HELD"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-purple-50 text-purple-700 border-purple-200"
                        )}
                      >
                        Escrow: {b.escrowStatus}
                      </span>
                    )}
                  </div>

                  <div className="text-right">
                    <span className="text-base font-black text-gray-900 dark:text-gray-100">
                      {formatPrice(bookingTotal, currentCurrency)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <p className="text-[11px] text-muted-foreground uppercase font-semibold">
                      Properti
                    </p>
                    <Link
                      href={`/properties/${b.propertyId}`}
                      className="font-bold text-gray-900 dark:text-gray-100 hover:text-purple-600 transition-colors"
                    >
                      {b.property?.title}
                    </Link>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {b.property?.address}
                    </p>
                  </div>

                  <div>
                    <p className="text-[11px] text-muted-foreground uppercase font-semibold">
                      Tamu (Penyewa)
                    </p>
                    <p className="font-bold text-gray-900 dark:text-gray-100">
                      {b.guest?.name || "Tamu"}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {b.guest?.email}
                      {b.guest?.phoneNumber && ` · ${b.guest.phoneNumber}`} · {b.guestsCount || 1} Tamu
                    </p>
                  </div>

                  <div>
                    <p className="text-[11px] text-muted-foreground uppercase font-semibold">
                      Jadwal Sewa
                    </p>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                      {formatWibDate(
                        b.startDate,
                        currentLang === "en" ? "en" : "id"
                      )}{" "}
                      (14:00) -{" "}
                      {formatWibDate(
                        b.endDate,
                        currentLang === "en" ? "en" : "id"
                      )}{" "}
                      (12:00 WIB)
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {b.totalNights || 1} malam (
                      {formatPrice(nightlyRate, currentCurrency)}/malam)
                    </p>
                  </div>
                </div>

                {/* Kontak Darurat & Alamat Domisili Tamu (Dispute & Incident Readiness) */}
                <div className="rounded-2xl p-3 bg-gray-50/80 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
                      <span>Kontak Darurat:</span>
                    </span>
                    {b.guest?.emergencyContactName || b.guest?.emergencyContactPhone ? (
                      <span className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-1.5 flex-wrap">
                        <span>{b.guest.emergencyContactName || "-"}</span>
                        {b.guest.emergencyContactRelation && (
                          <span className="text-[11px] text-muted-foreground font-normal">
                            ({b.guest.emergencyContactRelation})
                          </span>
                        )}
                        {b.guest?.emergencyContactPhone && (
                          <a
                            href={`tel:${b.guest.emergencyContactPhone}`}
                            className="text-purple-600 dark:text-purple-400 font-bold hover:underline inline-flex items-center gap-1 ml-1"
                          >
                            <Phone className="w-3 h-3" />
                            <span>{b.guest.emergencyContactPhone}</span>
                          </a>
                        )}
                      </span>
                    ) : (
                      <span className="text-gray-400 italic text-[11px]">
                        Belum diatur oleh tamu
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      Domisili:
                    </span>
                    {b.guest?.address ? (
                      <span className="font-semibold text-gray-900 dark:text-gray-100 max-w-xs truncate" title={b.guest.address}>
                        {b.guest.address}
                      </span>
                    ) : (
                      <span className="text-gray-400 italic text-[11px]">
                        Belum disediakan
                      </span>
                    )}
                  </div>
                </div>

                {b.cancelReason && (
                  <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-xs text-rose-800 dark:text-rose-200">
                    <strong>Alasan Batal / Kebijakan:</strong> {b.cancelReason}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
