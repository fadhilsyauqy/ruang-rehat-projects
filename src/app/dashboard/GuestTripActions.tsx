"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import CancelBookingModal from "@/components/bookings/CancelBookingModal"
import ReportDisputeModal from "@/components/bookings/ReportDisputeModal"
import { toCheckInDateTimeWIB, toEscrowReleaseDateTimeWIB } from "@/lib/date-standards"
import { ShieldAlert } from "lucide-react"

export default function GuestTripActions({ 
  booking, 
  t, 
  currentLang = "id" 
}: { 
  booking: any, 
  t: any, 
  currentLang?: string 
}) {
  if (booking.status === "CANCELLED" || booking.status === "COMPLETED") return null

  // Jika booking belum dibayar (PENDING)
  if (booking.paymentStatus === "PENDING") {
    return (
      <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
        <Link 
          href={`/checkout/${booking.id}?token=${booking.midtransToken || ""}`} 
          className={cn(buttonVariants({ variant: "default" }), "flex-1 bg-rose-500 hover:bg-rose-600 text-white font-semibold text-xs rounded-xl")}
        >
          {t?.btnPayNow || (currentLang === "en" ? "Pay Now" : "Bayar Sekarang")}
        </Link>
        <div className="flex-1">
          <CancelBookingModal 
            booking={booking} 
            t={t} 
            currentLang={currentLang} 
            trigger={
              <button 
                type="button" 
                className="w-full h-9 rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 text-red-600 font-semibold text-xs cursor-pointer"
              >
                {t?.btnCancel || (currentLang === "en" ? "Cancel" : "Batalkan")}
              </button>
            } 
          />
        </div>
      </div>
    )
  }

  // Jika sudah dibayar (PAID)
  if (booking.paymentStatus === "PAID") {
    const now = Date.now()
    const checkInDateTime = toCheckInDateTimeWIB(booking.startDate)
    const checkInTime = checkInDateTime.getTime()

    const deadline = booking.escrowReleaseAt 
      ? new Date(booking.escrowReleaseAt).getTime() 
      : toEscrowReleaseDateTimeWIB(booking.startDate).getTime()

    const isBeforeCheckIn = now < checkInTime
    const isWithinDisputeWindow = now >= checkInTime && now <= deadline && booking.escrowStatus === "HELD"
    const isDisputed = booking.escrowStatus === "DISPUTED"

    return (
      <div className="flex flex-col gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
        {/* E-Voucher Button */}
        <Link 
          href={`/bookings/${booking.id}/voucher`} 
          className={cn(buttonVariants({ variant: "outline" }), "w-full border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5")}
        >
          <span>{t?.printVoucher || (currentLang === "en" ? "View E-Voucher" : "Lihat E-Voucher")}</span>
        </Link>

        {/* Jika pesanan sedang dalam proses sengketa aktif */}
        {isDisputed && (
          <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-[11px] text-purple-700 dark:text-purple-300 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 text-purple-600" />
            <span className="font-medium">
              {currentLang === "en" 
                ? "Dispute under Admin investigation. Payout is temporarily frozen." 
                : "Sengketa sedang diinvestigasi Admin. Penyaluran dana escrow ke Host dibekukan."}
            </span>
          </div>
        )}

        {/* Garansi Komplain 24 Jam Check-in (Report Dispute) */}
        {isWithinDisputeWindow && (
          <ReportDisputeModal 
            booking={booking} 
            currentLang={currentLang} 
          />
        )}

        {/* Pembatalan Mandiri Tamu: Hanya sebelum jadwal check-in tiba */}
        {booking.status === "CONFIRMED" && isBeforeCheckIn && (
          <CancelBookingModal 
            booking={booking} 
            t={t} 
            currentLang={currentLang} 
          />
        )}
      </div>
    )
  }

  return null
}
