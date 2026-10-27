import React, { useState, useEffect } from "react"
import { Scale, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { formatPrice } from "@/lib/format"
import type { AdminDisputeItem } from "@/types"

export type DisputeResolutionType =
  | "RESOLVED_RELEASE_TO_HOST"
  | "RESOLVED_FULL_REFUND"
  | "RESOLVED_PARTIAL_REFUND"
  | "REJECTED"

export interface DisputeResolutionDialogProps {
  dispute: AdminDisputeItem | null
  onClose: () => void
  onResolve: (params: {
    disputeId: string
    resolution: DisputeResolutionType
    adminNotes: string
    refundApprovedIdr?: number
    payoutApprovedIdr?: number
  }) => Promise<void>
  loading: boolean
  currentCurrency?: string
  currentLang?: string
}

export default function DisputeResolutionDialog({
  dispute,
  onClose,
  onResolve,
  loading,
  currentCurrency = "IDR",
  currentLang = "id",
}: DisputeResolutionDialogProps) {
  const [resolution, setResolution] = useState<DisputeResolutionType>(
    "RESOLVED_RELEASE_TO_HOST"
  )
  const [adminNotes, setAdminNotes] = useState("")
  const [refundApprovedIdr, setRefundApprovedIdr] = useState<number>(0)
  const [payoutApprovedIdr, setPayoutApprovedIdr] = useState<number>(0)

  useEffect(() => {
    if (dispute) {
      setResolution("RESOLVED_RELEASE_TO_HOST")
      setAdminNotes("")
      const total =
        (dispute.booking?.totalPriceIdr ?? 0) > 0
          ? (dispute.booking?.totalPriceIdr ?? 0)
          : Math.round((dispute.booking?.totalPrice || 0) * 18051)
      setRefundApprovedIdr(Math.round(total / 2))
      setPayoutApprovedIdr(total - Math.round(total / 2))
    }
  }, [dispute])

  if (!dispute) return null

  const bookingTotal =
    (dispute.booking?.totalPriceIdr ?? 0) > 0
      ? (dispute.booking?.totalPriceIdr ?? 0)
      : Math.round((dispute.booking?.totalPrice || 0) * 18051)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onResolve({
      disputeId: dispute.id,
      resolution,
      adminNotes: adminNotes.trim(),
      refundApprovedIdr:
        resolution === "RESOLVED_PARTIAL_REFUND" ? Number(refundApprovedIdr) : undefined,
      payoutApprovedIdr:
        resolution === "RESOLVED_PARTIAL_REFUND" ? Number(payoutApprovedIdr) : undefined,
    })
  }

  return (
    <Dialog open={!!dispute} onOpenChange={(open) => !open && !loading && onClose()}>
      <DialogContent className="max-w-lg p-6 sm:p-7 rounded-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-1.5 pb-2">
          <div className="w-11 h-11 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center mb-1">
            <Scale className="w-5 h-5" />
          </div>
          <DialogTitle className="text-xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            {currentLang === "en" ? "Dispute Resolution Decision" : "Putusan Resolusi Sengketa"}
          </DialogTitle>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Pesanan #{dispute.bookingId?.slice(-8).toUpperCase()} · Properti:{" "}
            {dispute.booking?.property?.title}
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1 text-xs">
          {/* Claim Summary */}
          <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800 space-y-1.5">
            <div className="flex justify-between font-semibold">
              <span className="text-muted-foreground">Total Dana Pesanan:</span>
              <span className="font-extrabold text-gray-900 dark:text-gray-100">
                {formatPrice(bookingTotal, currentCurrency)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pelapor (Tamu):</span>
              <span className="font-medium text-gray-800 dark:text-gray-200">
                {dispute.booking?.guest?.name || "-"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Kategori Masalah:</span>
              <span className="font-semibold text-rose-600">
                {dispute.reasonCategory}
              </span>
            </div>
          </div>

          {/* Decision Choices */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300">
              Pilih Keputusan Admin:
            </label>

            <div className="space-y-2">
              <label
                className={cn(
                  "flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition-all",
                  loading && "opacity-60 cursor-not-allowed",
                  resolution === "RESOLVED_RELEASE_TO_HOST"
                    ? "border-purple-600 bg-purple-50/50 dark:bg-purple-950/30"
                    : "border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900"
                )}
              >
                <input
                  type="radio"
                  name="disputeRes"
                  className="mt-0.5"
                  disabled={loading}
                  checked={resolution === "RESOLVED_RELEASE_TO_HOST"}
                  onChange={() => setResolution("RESOLVED_RELEASE_TO_HOST")}
                />
                <div>
                  <p className="font-bold text-gray-900 dark:text-gray-100">
                    Rilis 100% Hak Dana ke Host
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Keluhan dianggap terselesaikan atau telah ada kesepakatan damai. Dana escrow dicairkan penuh ke saldo Host.
                  </p>
                </div>
              </label>

              <label
                className={cn(
                  "flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition-all",
                  loading && "opacity-60 cursor-not-allowed",
                  resolution === "RESOLVED_FULL_REFUND"
                    ? "border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30"
                    : "border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900"
                )}
              >
                <input
                  type="radio"
                  name="disputeRes"
                  className="mt-0.5"
                  disabled={loading}
                  checked={resolution === "RESOLVED_FULL_REFUND"}
                  onChange={() => setResolution("RESOLVED_FULL_REFUND")}
                />
                <div>
                  <p className="font-bold text-emerald-800 dark:text-emerald-300">
                    Refund 100% Penuh ke Tamu
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Properti tidak layak huni atau kunci tidak dapat diakses. Seluruh dana dikembalikan ke tamu dan pesanan dibatalkan.
                  </p>
                </div>
              </label>

              <label
                className={cn(
                  "flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition-all",
                  loading && "opacity-60 cursor-not-allowed",
                  resolution === "RESOLVED_PARTIAL_REFUND"
                    ? "border-blue-600 bg-blue-50/50 dark:bg-blue-950/30"
                    : "border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900"
                )}
              >
                <input
                  type="radio"
                  name="disputeRes"
                  className="mt-0.5"
                  disabled={loading}
                  checked={resolution === "RESOLVED_PARTIAL_REFUND"}
                  onChange={() => setResolution("RESOLVED_PARTIAL_REFUND")}
                />
                <div>
                  <p className="font-bold text-blue-800 dark:text-blue-300">
                    Bagi Sebagian / Split Partial
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Kompensasi parsial (misal: AC rusak sebagian, sebagian uang sewa dikembalikan ke tamu dan sisanya tetap untuk host).
                  </p>
                </div>
              </label>

              <label
                className={cn(
                  "flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition-all",
                  loading && "opacity-60 cursor-not-allowed",
                  resolution === "REJECTED"
                    ? "border-rose-600 bg-rose-50/50 dark:bg-rose-950/30"
                    : "border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900"
                )}
              >
                <input
                  type="radio"
                  name="disputeRes"
                  className="mt-0.5"
                  disabled={loading}
                  checked={resolution === "REJECTED"}
                  onChange={() => setResolution("REJECTED")}
                />
                <div>
                  <p className="font-bold text-rose-800 dark:text-rose-300">
                    Tolak Sengketa (Reject Claim)
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Klaim tamu tidak terbukti atau palsu. Escrow dirilis ke Host.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Allocation input if partial */}
          {resolution === "RESOLVED_PARTIAL_REFUND" && (
            <div className="p-3.5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 space-y-3">
              <p className="text-[11px] font-bold text-blue-900 dark:text-blue-200">
                Tentukan Alokasi Dana (Total: {formatPrice(bookingTotal, currentCurrency)}):
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-700 dark:text-gray-300 block mb-1">
                    Nominal Refund ke Tamu (IDR):
                  </label>
                  <Input
                    type="number"
                    disabled={loading}
                    value={refundApprovedIdr}
                    onChange={(e) => {
                      const val = Number(e.target.value) || 0
                      setRefundApprovedIdr(val)
                      setPayoutApprovedIdr(Math.max(0, bookingTotal - val))
                    }}
                    className="rounded-xl text-xs bg-white dark:bg-gray-900 disabled:opacity-60"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-700 dark:text-gray-300 block mb-1">
                    Nominal Payout ke Host (IDR):
                  </label>
                  <Input
                    type="number"
                    disabled={loading}
                    value={payoutApprovedIdr}
                    onChange={(e) =>
                      setPayoutApprovedIdr(Number(e.target.value) || 0)
                    }
                    className="rounded-xl text-xs bg-white dark:bg-gray-900 disabled:opacity-60"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Investigation Notes */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300">
              Catatan Investigasi & Alasan Keputusan:
            </label>
            <textarea
              required
              rows={3}
              disabled={loading}
              placeholder="Tuliskan pertimbangan dan bukti yang ditemukan selama investigasi..."
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              className="w-full border border-gray-200 dark:border-gray-800 rounded-xl p-3 focus:border-purple-500 outline-none text-xs bg-white dark:bg-gray-900 font-medium disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl text-xs disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menerapkan...</span>
                </>
              ) : (
                "Terapkan Keputusan"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
