import React, { useState, useRef } from "react"
import { Banknote, Upload, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { formatPrice } from "@/lib/format"
import type { AdminBookingItem } from "@/types"

export interface RefundConfirmDialogProps {
  booking:
    | (AdminBookingItem & {
        refundAmountIdr?: number | null
        refundBankName?: string | null
        refundAccountNumber?: string | null
        refundAccountHolder?: string | null
      })
    | null
  onClose: () => void
  onConfirmRefund: (bookingId: string, proofUrl: string) => Promise<void>
  loading: boolean
  currentCurrency?: string
}

export default function RefundConfirmDialog({
  booking,
  onClose,
  onConfirmRefund,
  loading,
  currentCurrency = "IDR",
}: RefundConfirmDialogProps) {
  const [proofUrl, setProofUrl] = useState("")
  const [prevBookingId, setPrevBookingId] = useState(booking?.id)
  const [uploadingProof, setUploadingProof] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (booking?.id !== prevBookingId) {
    setPrevBookingId(booking?.id)
    setProofUrl("")
  }

  if (!booking) return null

  const handleUploadProof = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"]
    if (!ALLOWED_TYPES.includes(file.type)) {
      alert("Hanya gambar dengan format JPEG, PNG, atau WebP yang diperbolehkan.")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Ukuran file bukti transfer melebihi batas maksimal 5 MB.")
      return
    }

    setUploadingProof(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("folder", "refunds")

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Gagal mengunggah bukti transfer")
      }

      setProofUrl(data.url)
    } catch (err: unknown) {
      const error = err as Error
      alert(error.message || "Gagal mengunggah bukti transfer")
    } finally {
      setUploadingProof(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onConfirmRefund(booking.id, proofUrl.trim())
  }

  return (
    <Dialog open={!!booking} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg p-6 sm:p-7 rounded-3xl">
        <DialogHeader className="space-y-1.5 pb-2">
          <div className="w-11 h-11 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mb-1">
            <Banknote className="w-5 h-5" />
          </div>
          <DialogTitle className="text-xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            Konfirmasi Transfer Pengembalian Dana
          </DialogTitle>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Pesanan #{booking.id?.slice(-8).toUpperCase()} · Tamu:{" "}
            {booking.guest?.name}
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1 text-xs">
          {/* Detail Transfer */}
          <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-emerald-800 dark:text-emerald-300 font-semibold">
                Nominal Transfer:
              </span>
              <span className="text-lg font-black text-emerald-700 dark:text-emerald-400">
                {formatPrice(booking.refundAmountIdr || 0, currentCurrency)}
              </span>
            </div>
            <div className="pt-2 border-t border-emerald-200/60 dark:border-emerald-900/60 space-y-1 text-gray-800 dark:text-gray-200">
              <p>
                <strong>Bank:</strong> {booking.refundBankName || "-"}
              </p>
              <p>
                <strong>No. Rekening:</strong>{" "}
                <span className="font-mono font-bold tracking-wider">
                  {booking.refundAccountNumber || "-"}
                </span>
              </p>
              <p>
                <strong>Atas Nama:</strong>{" "}
                {booking.refundAccountHolder || "-"}
              </p>
            </div>
          </div>

          {/* Input Link Bukti Transfer */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300">
              Link Bukti Transfer / Resi BI-FAST (Opsional):
            </label>
            <div className="flex gap-2">
              <Input
                type="url"
                placeholder="https://... (Link foto bukti transfer m-Banking / BI-FAST)"
                value={proofUrl}
                onChange={(e) => setProofUrl(e.target.value)}
                className="rounded-xl text-xs bg-white dark:bg-gray-900 flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading || uploadingProof}
                className="rounded-xl text-xs font-semibold shrink-0 cursor-pointer flex items-center gap-1.5 h-9"
              >
                {uploadingProof ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Upload className="w-3.5 h-3.5" />
                )}
                <span>{uploadingProof ? "Mengunggah..." : "Upload Resi"}</span>
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleUploadProof}
                className="hidden"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl text-xs"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer"
            >
              {loading ? "Menyimpan..." : "Konfirmasi Telah Ditransfer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
