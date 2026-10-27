import React, { useState } from "react"
import Link from "next/link"
import {
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  CalendarDays,
  User,
  Calendar,
  Phone,
  MapPin,
  ShieldAlert,
  SearchX,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { formatPrice, getBookingPriceIdr } from "@/lib/format"
import { BookingStatusBadge } from "@/components/ui/BookingStatusBadge"
import EmptyState from "@/components/ui/EmptyState"
import HostBookingActions from "../../HostBookingActions"
import type { Dictionary } from "@/lib/dictionary"
import type { HostIncomingBooking } from "@/types"

export interface HostBookingsTabProps {
  incomingBookings: HostIncomingBooking[]
  currentCurrency?: string
  currentLang?: string
  t: Partial<Dictionary>
}

export default function HostBookingsTab({
  incomingBookings,
  currentCurrency = "IDR",
  currentLang = "id",
  t,
}: HostBookingsTabProps) {
  const [bookingSearch, setBookingSearch] = useState("")
  const [bookingFilterStatus, setBookingFilterStatus] = useState<
    "ALL" | "PAID" | "PENDING" | "CANCELLED"
  >("ALL")

  const filteredIncomingBookings = incomingBookings.filter((b) => {
    const query = bookingSearch.toLowerCase()
    const matchesSearch =
      b.property?.title?.toLowerCase().includes(query) ||
      b.guest?.name?.toLowerCase().includes(query) ||
      b.guest?.email?.toLowerCase().includes(query)

    let matchesStatus = true
    if (bookingFilterStatus === "PAID") {
      matchesStatus = b.paymentStatus === "PAID"
    } else if (bookingFilterStatus === "PENDING") {
      matchesStatus = b.paymentStatus === "PENDING" && b.status !== "CANCELLED"
    } else if (bookingFilterStatus === "CANCELLED") {
      matchesStatus = b.status === "CANCELLED"
    }

    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={t.searchBookingPlaceholder}
            value={bookingSearch}
            onChange={(e) => setBookingSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-xs outline-none focus:border-rose-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setBookingFilterStatus("ALL")}
            className={cn(
              "px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap",
              bookingFilterStatus === "ALL"
                ? "bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200"
            )}
          >
            {t.allStatuses}
          </button>
          <button
            type="button"
            onClick={() => setBookingFilterStatus("PAID")}
            className={cn(
              "px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5",
              bookingFilterStatus === "PAID"
                ? "bg-emerald-600 text-white"
                : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100"
            )}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{t.statusPaid}</span>
          </button>
          <button
            type="button"
            onClick={() => setBookingFilterStatus("PENDING")}
            className={cn(
              "px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5",
              bookingFilterStatus === "PENDING"
                ? "bg-amber-600 text-white"
                : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 hover:bg-amber-100"
            )}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{t.statusPending}</span>
          </button>
          <button
            type="button"
            onClick={() => setBookingFilterStatus("CANCELLED")}
            className={cn(
              "px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5",
              bookingFilterStatus === "CANCELLED"
                ? "bg-gray-600 text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200"
            )}
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>{t.statusCancelled}</span>
          </button>
        </div>
      </div>

      {filteredIncomingBookings.length === 0 ? (
        incomingBookings.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title={t.noBookingsFound || (currentLang === "en" ? "No reservations found" : "Tidak ada pemesanan")}
            description={
              currentLang === "en"
                ? "You don't have any incoming guest reservations yet."
                : "Belum ada reservasi masuk dari tamu untuk properti Anda."
            }
          />
        ) : (
          <EmptyState
            icon={SearchX}
            title={t.noBookingsFound || (currentLang === "en" ? "No reservations found" : "Tidak ada pemesanan")}
            description={
              t.noIncomingBookingsWithFilter ||
              (currentLang === "en"
                ? "No reservations match your current filter criteria."
                : "Belum ada reservasi masuk dengan filter yang dipilih.")
            }
            actionLabel={currentLang === "en" ? "Reset Filter" : "Reset Filter"}
            onAction={() => {
              setBookingSearch("")
              setBookingFilterStatus("ALL")
            }}
          />
        )
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {filteredIncomingBookings.map((b) => (
            <div
              key={b.id}
              className="rounded-2xl border border-gray-150 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 shadow-xs transition-all hover:shadow-md flex flex-col justify-between gap-3.5"
            >
              {/* Property & Guest Info */}
              <div className="flex gap-3.5 items-start">
                <img
                  src={
                    b.property?.imageUrls?.[0] ||
                    "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80&w=300"
                  }
                  alt={b.property?.title}
                  className="w-18 h-18 sm:w-20 sm:h-20 rounded-xl object-cover shrink-0"
                />
                <div className="space-y-1 min-w-0 flex-1">
                  <h3 className="font-bold text-sm sm:text-base text-gray-900 dark:text-gray-100 truncate">
                    <Link
                      href={`/properties/${b.propertyId}`}
                      className="hover:text-rose-500 transition-colors"
                    >
                      {b.property?.title}
                    </Link>
                  </h3>
                  <div className="flex flex-wrap items-center gap-y-1 gap-x-2.5 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5 truncate">
                      <User className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                        {b.guest?.name}
                      </span>
                      <span className="hidden sm:inline text-[11px]">
                        ({b.guest?.email})
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span>
                      {new Date(b.startDate).toLocaleDateString(
                        currentLang === "en" ? "en-US" : "id-ID",
                        { day: "numeric", month: "short" }
                      )}
                      {" — "}
                      {new Date(b.endDate).toLocaleDateString(
                        currentLang === "en" ? "en-US" : "id-ID",
                        { day: "numeric", month: "short", year: "numeric" }
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Kontak Darurat & Alamat Tamu (Hanya untuk Pesanan Terkonfirmasi / Selesai) */}
              {(b.status === "CONFIRMED" || b.status === "COMPLETED" || b.paymentStatus === "PAID") && (
                <div className="rounded-xl p-3 bg-gray-50/80 dark:bg-gray-800/50 border border-gray-150 dark:border-gray-800/80 space-y-2 text-xs">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <span>
                        {currentLang === "en"
                          ? "Guest Safety & Incident Contact"
                          : "Data Keselamatan & Kontak Darurat Tamu"}
                      </span>
                    </span>
                    {b.guest?.phoneNumber && (
                      <a
                        href={`https://wa.me/${b.guest.phoneNumber.replace(/[^0-9]/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                        title={currentLang === "en" ? "Chat on WhatsApp" : "Hubungi via WhatsApp"}
                      >
                        <Phone className="w-3 h-3" />
                        <span>{b.guest.phoneNumber}</span>
                      </a>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1.5 border-t border-gray-200/60 dark:border-gray-700/60">
                    {/* Kontak Darurat Tamu */}
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-semibold text-gray-400 block uppercase">
                        {currentLang === "en" ? "Emergency Contact:" : "Kontak Darurat:"}
                      </span>
                      {b.guest?.emergencyContactName || b.guest?.emergencyContactPhone ? (
                        <div className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-1.5 flex-wrap">
                          <span>{b.guest.emergencyContactName || "-"}</span>
                          {b.guest.emergencyContactRelation && (
                            <span className="text-[10px] text-muted-foreground font-normal">
                              ({b.guest.emergencyContactRelation})
                            </span>
                          )}
                          {b.guest.emergencyContactPhone && (
                            <a
                              href={`tel:${b.guest.emergencyContactPhone}`}
                              className="text-rose-600 dark:text-rose-400 font-bold hover:underline inline-flex items-center gap-1"
                            >
                              <Phone className="w-3 h-3" />
                              <span>{b.guest.emergencyContactPhone}</span>
                            </a>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 italic text-[11px]">
                          {currentLang === "en"
                            ? "Not provided by guest"
                            : "Belum disediakan oleh tamu"}
                        </span>
                      )}
                    </div>

                    {/* Alamat Domisili Tamu */}
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-semibold text-gray-400 block uppercase">
                        {currentLang === "en" ? "Residential Address:" : "Alamat Domisili:"}
                      </span>
                      {b.guest?.address ? (
                        <div className="flex items-start gap-1 font-medium text-gray-700 dark:text-gray-300">
                          <MapPin className="w-3 h-3 text-gray-400 shrink-0 mt-0.5" />
                          <span className="line-clamp-2" title={b.guest.address}>
                            {b.guest.address}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic text-[11px]">
                          {currentLang === "en"
                            ? "Not provided"
                            : "Belum disediakan"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Status and Actions */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                <div className="flex flex-wrap items-center gap-2">
                  <BookingStatusBadge
                    status={b.status}
                    paymentStatus={b.paymentStatus}
                    escrowStatus={b.escrowStatus}
                    currentLang={currentLang}
                  />

                  {b.paymentStatus === "PAID" && b.escrowStatus === "RELEASED" && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                      {t.escrowReleasedBadge || "Escrow Dirilis"}
                    </span>
                  )}
                  {b.paymentStatus === "PAID" && b.escrowStatus === "HELD" && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                      {t.escrowHeldBadge || "Escrow Ditahan"}
                    </span>
                  )}
                  {b.escrowStatus === "REFUNDED_TO_GUEST" && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                      {currentLang === "en" ? "Refunded to Guest" : "Refund ke Tamu"}
                    </span>
                  )}

                  <span className="text-sm font-black text-gray-900 dark:text-gray-100">
                    {formatPrice(getBookingPriceIdr(b), currentCurrency)}
                  </span>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <HostBookingActions booking={b} t={t} currentLang={currentLang} />
                </div>
              </div>

              {b.cancelReason && (
                <p className="text-[11px] text-red-600 dark:text-red-400 italic bg-red-50 dark:bg-red-950/40 p-2 rounded-xl">
                  {t.cancelReasonLabel ||
                    (currentLang === "en"
                      ? "Cancellation reason:"
                      : "Alasan batal:")}{" "}
                  &quot;{b.cancelReason}&quot;
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
