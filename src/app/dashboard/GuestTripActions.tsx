"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import CancelBookingModal from "@/components/bookings/CancelBookingModal"
import ReportDisputeModal from "@/components/bookings/ReportDisputeModal"
import { toCheckInDateTimeWIB, toEscrowReleaseDateTimeWIB } from "@/lib/date-standards"
import { ShieldAlert, RotateCw, CheckCircle2, AlertCircle } from "lucide-react"
import type { Dictionary } from "@/lib/dictionary"
import type { GuestTripBooking } from "@/types"

export default function GuestTripActions({ 
  booking, 
  t, 
  currentLang = "id",
  nowTime = 0
}: { 
  booking: GuestTripBooking, 
  t?: Partial<Dictionary>, 
  currentLang?: string,
  nowTime?: number
}) {
  const [syncing, setSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState<{ type: "success" | "error" | "info", text: string } | null>(null)
  const router = useRouter()

  if (booking.status === "CANCELLED" || booking.status === "COMPLETED") return null

  const handleSyncStatus = async () => {
    setSyncing(true)
    setSyncMessage(null)
    try {
      const res = await fetch("/api/payment/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: booking.id }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || (currentLang === "en" ? "Failed to verify status" : "Gagal memverifikasi status"))
      }

      if (data.paymentStatus === "PAID") {
        setSyncMessage({
          type: "success",
          text: data.message || (currentLang === "en" ? "Payment verified successfully!" : "Pembayaran berhasil diverifikasi!")
        })
        setTimeout(() => {
          router.refresh()
        }, 1200)
      } else {
        setSyncMessage({
          type: "info",
          text: data.message || (currentLang === "en" ? "Payment not completed yet" : "Pembayaran belum diselesaikan di gateway")
        })
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : ""
      setSyncMessage({
        type: "error",
        text: msg || (currentLang === "en" ? "Error checking payment" : "Terjadi kesalahan saat memeriksa pembayaran")
      })
    } finally {
      setSyncing(false)
    }
  }

  // Jika booking belum dibayar (PENDING)
  if (booking.paymentStatus === "PENDING") {
    return (
      <div className="flex flex-col gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
        <div className="flex gap-2">
          <Link 
            href={`/checkout/${booking.id}?token=${booking.midtransToken || ""}`} 
            className={cn(buttonVariants({ variant: "default" }), "flex-1 bg-rose-500 hover:bg-rose-600 text-white font-semibold text-xs rounded-xl h-9")}
          >
            {t?.btnPayNow || (currentLang === "en" ? "Pay Now" : "Bayar Sekarang")}
          </Link>
          <button
            type="button"
            onClick={handleSyncStatus}
            disabled={syncing}
            className="flex-1 inline-flex items-center justify-center gap-1.5 h-9 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/60 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-semibold text-xs transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <RotateCw className={cn("w-4 h-4", syncing && "animate-spin")} />
            <span>
              {syncing 
                ? (currentLang === "en" ? "Checking..." : "Memeriksa...") 
                : (currentLang === "en" ? "Check Status" : "Cek Status")}
            </span>
          </button>
        </div>

        {syncMessage && (
          <div className={cn(
            "p-2.5 rounded-xl text-[11px] leading-snug flex items-center gap-2",
            syncMessage.type === "success" && "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800",
            syncMessage.type === "info" && "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800",
            syncMessage.type === "error" && "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
          )}>
            {syncMessage.type === "success" && <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600" />}
            {syncMessage.type === "info" && <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-600" />}
            {syncMessage.type === "error" && <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />}
            <span>{syncMessage.text}</span>
          </div>
        )}

        <div className="flex justify-end pt-0.5">
          <CancelBookingModal 
            booking={booking} 
            t={t} 
            currentLang={currentLang} 
            trigger={
              <button 
                type="button" 
                className="text-xs text-muted-foreground hover:text-red-600 hover:underline transition-colors cursor-pointer py-1"
              >
                {t?.btnCancel || (currentLang === "en" ? "Cancel Reservation" : "Batalkan Pesanan")}
              </button>
            } 
          />
        </div>
      </div>
    )
  }

  // Jika sudah dibayar (PAID)
  if (booking.paymentStatus === "PAID") {
    const now = nowTime
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
