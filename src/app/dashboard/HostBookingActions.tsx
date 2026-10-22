"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { AlertTriangle, ShieldAlert } from "lucide-react"

export default function HostBookingActions({ 
  booking, 
  t, 
  currentLang = "id" 
}: { 
  booking: any, 
  t: any, 
  currentLang?: string 
}) {
  const [loading, setLoading] = useState(false)
  const [reason, setReason] = useState("")
  const [open, setOpen] = useState(false)
  const router = useRouter()

  const handleCancel = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch(`/api/bookings/${booking.id}/cancel`, { 
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cancelReason: reason.trim() })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || t?.failedToCancel || (currentLang === "en" ? "Failed to cancel booking" : "Gagal membatalkan pesanan"))
      
      if (data.policyNote) {
        alert(data.policyNote)
      }
      setOpen(false)
      router.refresh()
    } catch (e: any) {
      alert(e.message)
    } finally {
      setLoading(false)
    }
  }

  const isCancelledOrCompleted = booking.status === "CANCELLED" || booking.status === "COMPLETED"
  const isPaid = booking.paymentStatus === "PAID"

  return (
    <div>
      {/* Tombol Batalkan Pesanan Tamu (jika belum selesai/batal) */}
      {!isCancelledOrCompleted && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger className="text-xs font-semibold text-rose-500 hover:text-rose-600 hover:underline cursor-pointer">
            {t?.btnCancelGuest || (currentLang === "en" ? "Cancel Booking" : "Batalkan Reservasi")}
          </DialogTrigger>
          <DialogContent className="max-w-lg p-6 sm:p-7 rounded-3xl">
            <DialogHeader className="space-y-1.5 pb-2">
              <div className="w-11 h-11 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mb-1">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <DialogTitle className="text-xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                {t?.cancelGuestModalTitle || (currentLang === "en" ? "Host Cancellation Notice" : "Pembatalan Sepihak oleh Host")}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
                #{booking.id.slice(-8).toUpperCase()} · {booking.guest?.name || "Tamu"}
              </DialogDescription>
            </DialogHeader>

            {/* Peringatan Konsekuensi & Penalti Host jika pesanan sudah PAID */}
            {isPaid && (
              <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 space-y-2 text-xs text-rose-800 dark:text-rose-300">
                <div className="flex items-center gap-2 font-bold text-rose-900 dark:text-rose-200">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  <span>{currentLang === "en" ? "Host Cancellation Penalties Apply:" : "Sanksi & Penalti Pembatalan Host:"}</span>
                </div>
                <ul className="list-disc pl-5 space-y-1 text-[11px] leading-relaxed">
                  <li>
                    <strong>{currentLang === "en" ? "100% Full Refund:" : "Refund Penuh 100%:"}</strong>{" "}
                    {currentLang === "en" ? "Guest receives full refund including service fee." : "Tamu menerima pengembalian dana 100% penuh termasuk biaya layanan."}
                  </li>
                  <li>
                    <strong>{currentLang === "en" ? "Calendar Lock:" : "Kalender Dikunci Sistem:"}</strong>{" "}
                    {currentLang === "en" ? "Dates will be permanently locked against offline re-booking." : "Tanggal reservasi akan dikunci permanen oleh sistem agar tidak bisa disewakan offline."}
                  </li>
                  <li>
                    <strong>{currentLang === "en" ? "Financial Penalty:" : "Penalti Finansial Rp 250.000:"}</strong>{" "}
                    {currentLang === "en" ? "Rp 250,000 fine will be deducted from your next payout balance." : "Denda Rp 250.000 akan dipotong otomatis dari pencairan dana payout Anda berikutnya."}
                  </li>
                </ul>
              </div>
            )}

            <form onSubmit={handleCancel} className="space-y-4 pt-2 text-xs">
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-gray-700 dark:text-gray-300">
                  {t?.cancelReasonTitle || (currentLang === "en" ? "Cancellation Reason" : "Alasan Pembatalan Wajib")}
                </label>
                <textarea 
                  required 
                  rows={3}
                  className="w-full border border-gray-200 dark:border-gray-800 rounded-xl p-3 focus:border-rose-500 outline-none text-xs bg-white dark:bg-gray-900 font-medium" 
                  placeholder={t?.cancelReasonPlaceholder || (currentLang === "en" ? "Explain to the guest why you need to cancel this booking..." : "Beri tahu tamu alasan mendesak pembatalan ini (misal: kebocoran pipa darurat)...")}
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setOpen(false)}
                  disabled={loading}
                  className="rounded-xl text-xs font-medium"
                >
                  {currentLang === "en" ? "Back" : "Kembali"}
                </Button>
                <Button 
                  type="submit" 
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs" 
                  disabled={loading || !reason.trim()}
                >
                  {loading 
                    ? (t?.processing || (currentLang === "en" ? "Processing..." : "Memproses...")) 
                    : (t?.confirmCancelBtn || (currentLang === "en" ? "Confirm Host Cancellation" : "Konfirmasi Pembatalan"))}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
