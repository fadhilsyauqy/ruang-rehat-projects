"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { formatPrice } from "@/lib/format"
import { toCheckInDateTimeWIB, formatWibCheckIn } from "@/lib/date-standards"
import { AlertCircle, Banknote, CalendarX, Info, Loader2 } from "lucide-react"

interface CancelBookingModalProps {
  booking: any
  t: any
  currentLang?: string
  currentCurrency?: string
  trigger?: React.ReactNode
}

const INDONESIAN_BANKS = [
  "BCA (Bank Central Asia)",
  "Bank Mandiri",
  "BRI (Bank Rakyat Indonesia)",
  "BNI (Bank Negara Indonesia)",
  "BSI (Bank Syariah Indonesia)",
  "Bank Jago",
  "SeaBank",
  "CIMB Niaga",
  "Bank Permata",
  "Bank Danamon",
  "Lainnya"
]

export default function CancelBookingModal({
  booking,
  t,
  currentLang = "id",
  currentCurrency = "IDR",
  trigger,
}: CancelBookingModalProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")

  const [bankName, setBankName] = useState(booking.refundBankName || "BCA (Bank Central Asia)")
  const [accountNumber, setAccountNumber] = useState(booking.refundAccountNumber || "")
  const [accountHolder, setAccountHolder] = useState(booking.refundAccountHolder || "")
  const [cancelReason, setCancelReason] = useState("")

  const router = useRouter()

  const isPaid = booking.paymentStatus === "PAID"
  const totalPriceIdr = booking.totalPriceIdr > 0 
    ? booking.totalPriceIdr 
    : Math.round((booking.totalPrice || 0) * 18051)

  const guestServiceFeeIdr = booking.guestServiceFeeIdr > 0
    ? booking.guestServiceFeeIdr
    : Math.round(totalPriceIdr * 0.10)

  const grossStayIdr = Math.max(0, totalPriceIdr - guestServiceFeeIdr)

  // Hitung persentase pengembalian dana berdasarkan jam check-in resmi (14:00 WIB)
  const now = Date.now()
  const checkInDateTime = toCheckInDateTimeWIB(booking.startDate)
  const checkInTime = checkInDateTime.getTime()
  const hoursUntilCheckIn = (checkInTime - now) / (1000 * 60 * 60)
  const daysUntilCheckIn = hoursUntilCheckIn / 24

  const policy = booking.property?.cancellationPolicy || "FLEXIBLE"
  let refundPercentage = 0
  let policyExplanation = ""

  if (policy === "FLEXIBLE") {
    if (hoursUntilCheckIn >= 24) {
      refundPercentage = 100
      policyExplanation = currentLang === "en" 
        ? "Flexible Policy: Cancelled >24h before check-in (100% room refund)" 
        : "Kebijakan Fleksibel: Pembatalan >24 jam sebelum check-in (Refund 100% biaya sewa)"
    } else {
      refundPercentage = 50
      policyExplanation = currentLang === "en" 
        ? "Flexible Policy: Cancelled <24h before check-in (50% room refund)" 
        : "Kebijakan Fleksibel: Pembatalan <24 jam sebelum check-in (Refund 50% biaya sewa)"
    }
  } else if (policy === "MODERATE") {
    if (daysUntilCheckIn >= 5) {
      refundPercentage = 100
      policyExplanation = currentLang === "en" 
        ? "Moderate Policy: Cancelled >5 days before check-in (100% room refund)" 
        : "Kebijakan Moderat: Pembatalan >5 hari sebelum check-in (Refund 100% biaya sewa)"
    } else {
      refundPercentage = 50
      policyExplanation = currentLang === "en" 
        ? "Moderate Policy: Cancelled <5 days before check-in (50% room refund)" 
        : "Kebijakan Moderat: Pembatalan <5 hari sebelum check-in (Refund 50% biaya sewa)"
    }
  } else if (policy === "STRICT") {
    if (daysUntilCheckIn >= 7) {
      refundPercentage = 50
      policyExplanation = currentLang === "en" 
        ? "Strict Policy: Cancelled >7 days before check-in (50% room refund)" 
        : "Kebijakan Ketat: Pembatalan >7 hari sebelum check-in (Refund 50% biaya sewa)"
    } else {
      refundPercentage = 0
      policyExplanation = currentLang === "en" 
        ? "Strict Policy: Cancelled <7 days before check-in (Non-refundable / 0%)" 
        : "Kebijakan Ketat: Pembatalan <7 hari sebelum check-in (Hangus / Non-refundable 0%)"
    }
  }

  const estimatedRefundIdr = isPaid ? Math.round(grossStayIdr * (refundPercentage / 100)) : 0

  const handleCancelBooking = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg("")

    if (isPaid && estimatedRefundIdr > 0) {
      if (!accountNumber.trim() || !accountHolder.trim()) {
        setErrorMsg(currentLang === "en" ? "Please fill in your bank account details for refund transfer." : "Mohon lengkapi nomor rekening dan nama pemilik rekening tujuan refund.")
        return
      }
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/bookings/${booking.id}/cancel`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cancelReason: cancelReason.trim(),
          refundBankName: isPaid && estimatedRefundIdr > 0 ? bankName : undefined,
          refundAccountNumber: isPaid && estimatedRefundIdr > 0 ? accountNumber.trim() : undefined,
          refundAccountHolder: isPaid && estimatedRefundIdr > 0 ? accountHolder.trim() : undefined,
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Gagal membatalkan pesanan")

      setOpen(false)
      router.refresh()
    } catch (err: any) {
      setErrorMsg(err.message || "Terjadi kesalahan saat membatalkan")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <DialogTrigger render={trigger as any} />
      ) : (
        <DialogTrigger className="w-full text-xs text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 py-2 rounded-xl font-medium transition-colors cursor-pointer">
          {t?.btnCancelOrder || (currentLang === "en" ? "Cancel Reservation" : "Batalkan Pesanan")}
        </DialogTrigger>
      )}

      <DialogContent className="max-w-lg p-6 sm:p-7 rounded-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-1.5 pb-2">
          <div className="w-11 h-11 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mb-1">
            <CalendarX className="w-5 h-5" />
          </div>
          <DialogTitle className="text-xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            {currentLang === "en" ? "Cancel Reservation" : "Batalkan Pesanan"}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
            {booking.property?.title} · #{booking.id.slice(-8).toUpperCase()}
          </DialogDescription>
        </DialogHeader>

        {errorMsg && (
          <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleCancelBooking} className="space-y-4 pt-1 text-xs">
          {/* Kalkulasi Hak Refund Transparan */}
          {isPaid ? (
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-900/60 p-4 space-y-2.5">
              <div className="flex items-center justify-between font-bold text-gray-900 dark:text-gray-100 text-xs border-b border-gray-200 dark:border-gray-800 pb-2">
                <span>{currentLang === "en" ? "Refund Calculation Breakdown" : "Rincian Pengembalian Dana"}</span>
                <span className="text-rose-600 dark:text-rose-400">{policy}</span>
              </div>

              <div className="space-y-1 text-gray-600 dark:text-gray-400">
                <div className="flex justify-between text-muted-foreground text-[11px] pb-1 border-b border-gray-150 dark:border-gray-800/60">
                  <span>{currentLang === "en" ? "Standard Check-in Time" : "Waktu Check-in Resmi"}</span>
                  <span className="font-medium text-gray-800 dark:text-gray-300">{formatWibCheckIn(booking.startDate, currentLang === "en" ? "en" : "id")}</span>
                </div>
                <div className="flex justify-between">
                  <span>{currentLang === "en" ? "Total Paid (Settled)" : "Total Tagihan Lunas"}</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-200">{formatPrice(totalPriceIdr, currentCurrency)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>{currentLang === "en" ? "Guest Service Fee (Non-refundable)" : "Biaya Layanan Tamu (Non-refundable)"}</span>
                  <span>- {formatPrice(guestServiceFeeIdr, currentCurrency)}</span>
                </div>
                <div className="flex justify-between">
                  <span>{currentLang === "en" ? "Eligible Room & Cleaning Fee" : "Biaya Sewa & Kebersihan"}</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-200">{formatPrice(grossStayIdr, currentCurrency)}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between">
                <div>
                  <span className="font-bold text-gray-900 dark:text-gray-100 block">
                    {currentLang === "en" ? "Estimated Refund Amount" : "Estimasi Dana Dikembalikan"}
                  </span>
                  <span className="text-[10px] text-muted-foreground block">{policyExplanation}</span>
                </div>
                <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                  {formatPrice(estimatedRefundIdr, currentCurrency)}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-[11px] text-blue-700 dark:text-blue-300 flex items-start gap-2">
                <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>
                  {currentLang === "en"
                    ? "Service fee (10%) covers payment gateway processing and is non-refundable on guest cancellation."
                    : "Biaya layanan (10%) tidak dapat dikembalikan untuk menutup biaya payment gateway Midtrans."}
                </span>
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300">
              <p className="font-semibold">{currentLang === "en" ? "Unpaid Reservation" : "Pesanan Belum Dibayar"}</p>
              <p className="text-[11px] mt-0.5 text-amber-700 dark:text-amber-400">
                {currentLang === "en" 
                  ? "Cancelling will immediately release the reserved dates back to other guests."
                  : "Pembatalan akan langsung membuka kembali slot tanggal bagi pemesan lain tanpa biaya apa pun."}
              </p>
            </div>
          )}

          {/* Form Rekening Bank Tujuan Refund jika ada dana yang harus dikembalikan */}
          {isPaid && estimatedRefundIdr > 0 && (
            <div className="space-y-3 pt-1 border-t border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-1.5 font-bold text-gray-900 dark:text-gray-100">
                <Banknote className="w-4 h-4 text-emerald-600" />
                <span>{currentLang === "en" ? "Bank Account for Refund Transfer" : "Rekening Bank Tujuan Refund"}</span>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">
                  {currentLang === "en" ? "Bank Name" : "Nama Bank"}
                </label>
                <select
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-xs font-medium outline-none focus:border-rose-500"
                >
                  {INDONESIAN_BANKS.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">
                    {currentLang === "en" ? "Account Number" : "Nomor Rekening"}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: 8820192381"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-xs font-medium outline-none focus:border-rose-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">
                    {currentLang === "en" ? "Account Holder Name" : "Nama Pemilik Rekening"}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Sesuai buku tabungan"
                    value={accountHolder}
                    onChange={(e) => setAccountHolder(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-xs font-medium outline-none focus:border-rose-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Alasan Pembatalan */}
          <div className="space-y-1 pt-1">
            <label className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">
              {currentLang === "en" ? "Reason for Cancellation (Optional)" : "Alasan Pembatalan (Opsional)"}
            </label>
            <textarea
              rows={2}
              placeholder={currentLang === "en" ? "Tell us why you are cancelling..." : "Tuliskan alasan pembatalan Anda..."}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-xs font-medium outline-none focus:border-rose-500"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={() => setOpen(false)}
              className="rounded-xl text-xs"
            >
              {currentLang === "en" ? "Keep Booking" : "Tetap Pesan"}
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold"
            >
              {loading ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>{currentLang === "en" ? "Processing..." : "Memproses..."}</span>
                </span>
              ) : (
                currentLang === "en" ? "Confirm Cancellation" : "Konfirmasi Pembatalan"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
