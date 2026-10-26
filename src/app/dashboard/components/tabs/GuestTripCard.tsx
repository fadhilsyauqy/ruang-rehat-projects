import React from "react"
import Link from "next/link"
import {
  MapPin,
  CalendarDays,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  Star,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { formatPrice, getBookingPriceIdr } from "@/lib/format"
import {
  toCheckInDateTimeWIB,
  toCheckOutDateTimeWIB,
  calculateStayNights,
  formatWibDate,
} from "@/lib/date-standards"
import GuestTripActions from "../../GuestTripActions"
import ReviewModal from "../../ReviewModal"
import type { Dictionary } from "@/lib/dictionary"
import type { GuestTripBooking } from "@/types"

export interface GuestTripCardProps {
  booking: GuestTripBooking
  nowTime: number
  currentCurrency?: string
  currentLang?: string
  t: Partial<Dictionary>
}

export default function GuestTripCard({
  booking: b,
  nowTime,
  currentCurrency = "IDR",
  currentLang = "id",
  t,
}: GuestTripCardProps) {
  const isPastCheckIn = nowTime >= toCheckInDateTimeWIB(b.startDate).getTime()
  const isPastCheckOut = nowTime >= toCheckOutDateTimeWIB(b.endDate).getTime()
  const isOngoing =
    isPastCheckIn &&
    !isPastCheckOut &&
    b.status === "CONFIRMED" &&
    b.paymentStatus === "PAID"
  const isCompleted =
    b.status === "COMPLETED" ||
    (b.paymentStatus === "PAID" && b.status !== "CANCELLED" && isPastCheckOut)
  const nights = b.totalNights || calculateStayNights(b.startDate, b.endDate)

  return (
    <div className="rounded-2xl border border-gray-150 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col sm:flex-row group">
      {/* Thumbnail Properti */}
      <div className="w-full sm:w-56 md:w-64 h-52 sm:h-auto shrink-0 relative bg-gray-100 dark:bg-gray-800 overflow-hidden">
        <img
          src={
            b.property.imageUrls?.[0] ||
            "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80&w=400"
          }
          alt={b.property.title}
          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
        />

        {/* Dynamic Status Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1">
          {b.status === "CANCELLED" ? (
            <span className="backdrop-blur-md px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-600/90 text-white shadow-xs">
              {t.statusCancelled ||
                (currentLang === "en" ? "Cancelled" : "Dibatalkan")}
            </span>
          ) : isOngoing ? (
            <span className="backdrop-blur-md px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-600/90 text-white shadow-xs animate-pulse flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>
                {currentLang === "en" ? "Ongoing Stay" : "Sedang Menginap"}
              </span>
            </span>
          ) : isCompleted ? (
            <span className="backdrop-blur-md px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-600/90 text-white shadow-xs">
              ✓ {currentLang === "en" ? "Completed" : "Selesai"}
            </span>
          ) : b.paymentStatus === "PAID" ? (
            <span className="backdrop-blur-md px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-600/90 text-white shadow-xs">
              {t.statusPaid ||
                (currentLang === "en" ? "Confirmed" : "Terkonfirmasi")}
            </span>
          ) : (
            <span className="backdrop-blur-md px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/90 text-white shadow-xs">
              {t.statusPending ||
                (currentLang === "en" ? "Pending" : "Menunggu Bayar")}
            </span>
          )}
        </div>

        {/* Durasi Menginap Floating Badge */}
        <div className="absolute bottom-2.5 left-2.5 backdrop-blur-md px-2 py-0.5 rounded-md bg-black/60 text-white text-[9px] font-bold">
          {nights}{" "}
          {currentLang === "en"
            ? nights > 1
              ? "nights"
              : "night"
            : "malam"}
        </div>
      </div>

      {/* Konten & Aksi Perjalanan */}
      <div className="p-4 sm:p-5 flex-1 min-w-0 flex flex-col justify-between gap-3">
        {/* Header Detail */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <span className="font-bold uppercase tracking-wider text-rose-500">
              {b.property.category || "Ruang Rehat Stay"}
            </span>
            <span className="font-mono text-[10px] text-gray-400">
              #{b.id.slice(-8).toUpperCase()}
            </span>
          </div>

          <h3 className="font-bold text-sm sm:text-base text-gray-900 dark:text-gray-100 hover:text-rose-500 transition-colors line-clamp-1">
            <Link href={`/properties/${b.propertyId}`}>{b.property.title}</Link>
          </h3>

          <p className="text-muted-foreground text-xs flex items-center gap-1 truncate">
            <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0" />
            <span className="truncate">{b.property.address}</span>
          </p>
        </div>

        {/* Info Tanggal & Finansial */}
        <div className="bg-gray-50/80 dark:bg-gray-800/40 p-2.5 rounded-xl text-xs space-y-1.5 border border-gray-150 dark:border-gray-800/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
              <CalendarDays className="w-3 h-3 text-gray-400" />
              <span>
                {t.dates || (currentLang === "en" ? "Dates:" : "Jadwal:")}
              </span>
            </div>
            <span className="font-semibold text-gray-900 dark:text-gray-100 text-xs">
              {formatWibDate(b.startDate, currentLang === "en" ? "en" : "id")}{" "}
              (14:00) –{" "}
              {formatWibDate(b.endDate, currentLang === "en" ? "en" : "id")}{" "}
              (12:00 WIB)
            </span>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-gray-200/50 dark:border-gray-700/50">
            <div className="flex items-center gap-1 text-[11px]">
              <span className="text-muted-foreground">
                {currentLang === "en" ? "Total Price:" : "Total Biaya:"}
              </span>
              <span className="inline-flex items-center gap-0.5 text-[9px] text-emerald-600 dark:text-emerald-400 font-medium">
                <ShieldCheck className="w-2.5 h-2.5" />
                <span>Escrow</span>
              </span>
            </div>
            <span className="font-black text-sm text-gray-900 dark:text-white">
              {formatPrice(getBookingPriceIdr(b), currentCurrency)}
            </span>
          </div>
        </div>

        {/* Notifikasi Pembatalan (Jika Dibatalkan) */}
        {b.status === "CANCELLED" && (
          <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 space-y-1">
            <div className="flex items-center justify-between font-semibold">
              <span className="flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>
                  {currentLang === "en"
                    ? "Cancellation Notice"
                    : "Catatan Pembatalan"}
                </span>
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900/60">
                {b.paymentStatus === "REFUNDED"
                  ? currentLang === "en"
                    ? "Refund Processed"
                    : "Refund 100% Diproses"
                  : b.paymentStatus}
              </span>
            </div>
            {b.cancelReason && (
              <p className="italic text-[11px] text-rose-600 dark:text-rose-400 pl-4">
                &quot;{b.cancelReason}&quot;
              </p>
            )}
          </div>
        )}

        {/* Notifikasi Sedang Menginap */}
        {isOngoing && (
          <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-xs text-indigo-700 dark:text-indigo-300 flex items-center gap-2">
            <Sparkles className="w-4 h-4 shrink-0 text-indigo-500" />
            <span className="leading-tight">
              {currentLang === "en"
                ? "You are currently staying at this property. Enjoy your stay!"
                : "Anda sedang dalam masa menginap. Selamat menikmati liburan Anda!"}
            </span>
          </div>
        )}

        {/* Area Aksi Sesuai Status Pesanan */}
        <div className="space-y-2 pt-1 border-t border-gray-100 dark:border-gray-800">
          {isCompleted && (
            <div className="space-y-2">
              {/* Modul Ulasan Tamu */}
              {b.reviews && b.reviews.length === 0 ? (
                <div className="p-3 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 dark:text-amber-200">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>
                        {currentLang === "en"
                          ? "How was your stay?"
                          : "Bagaimana pengalaman Anda?"}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      {currentLang === "en"
                        ? "Leave a 5-star review to support your host."
                        : "Beri rating & ulasan untuk membantu wisatawan lain."}
                    </p>
                  </div>
                  <div className="shrink-0 sm:w-44">
                    <ReviewModal
                      bookingId={b.id}
                      propertyId={b.propertyId}
                      currentLang={currentLang}
                      t={t}
                    />
                  </div>
                </div>
              ) : b.reviews && b.reviews.length > 0 ? (
                <div className="p-3 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-amber-500">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            "w-3.5 h-3.5",
                            i < (b.reviews[0]?.rating || 5)
                              ? "fill-amber-400 text-amber-400"
                              : "text-gray-300"
                          )}
                        />
                      ))}
                      <span className="font-bold text-gray-900 dark:text-gray-100 ml-1">
                        {b.reviews[0]?.rating}/5
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded-full">
                      ✓{" "}
                      {currentLang === "en"
                        ? "Review Published"
                        : "Ulasan Terbit"}
                    </span>
                  </div>
                  {b.reviews[0]?.comment && (
                    <p className="text-[11px] text-muted-foreground italic line-clamp-2">
                      &quot;{b.reviews[0].comment}&quot;
                    </p>
                  )}
                </div>
              ) : null}

              {/* Tombol Navigasi Sekunder */}
              <div className="flex items-center gap-2">
                <Link
                  href={`/bookings/${b.id}/voucher`}
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "flex-1 text-xs rounded-xl font-semibold border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800"
                  )}
                >
                  {currentLang === "en" ? "View Receipt" : "Bukti Pembayaran"}
                </Link>
                <Link
                  href={`/properties/${b.propertyId}`}
                  className={cn(
                    buttonVariants({ variant: "default" }),
                    "flex-1 text-xs rounded-xl font-semibold bg-gray-900 hover:bg-black dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
                  )}
                >
                  {currentLang === "en" ? "Book Again" : "Pesan Lagi"}
                </Link>
              </div>
            </div>
          )}

          {!isCompleted && b.status !== "CANCELLED" && (
            <GuestTripActions booking={b} t={t} currentLang={currentLang} nowTime={nowTime} />
          )}
        </div>
      </div>
    </div>
  )
}
