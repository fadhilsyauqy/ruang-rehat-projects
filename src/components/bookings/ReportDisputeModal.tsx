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
import { toEscrowReleaseDateTimeWIB, formatWibDateTime } from "@/lib/date-standards"
import { AlertTriangle, Clock, Info, Loader2, ShieldAlert, X } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

export interface ReportDisputeBookingData {
  id: string
  startDate: Date | string
  escrowReleaseAt?: Date | string | null
}

interface ReportDisputeModalProps {
  booking: ReportDisputeBookingData
  currentLang?: string
  trigger?: React.ReactElement
}

const DISPUTE_REASONS = [
  { id: "ACCESSIBILITY", labelId: "Kunci Tidak Dapat Diakses / Tuan Rumah Tidak Merespons", labelEn: "Key Inaccessible / Host Unresponsive" },
  { id: "ACCURACY", labelId: "Fasilitas Rusak Parah / Tidak Sesuai Deskripsi", labelEn: "Severe Facility Damage / Listing Inaccurate" },
  { id: "CLEANLINESS", labelId: "Kebersihan Sangat Buruk / Tidak Layak Huni", labelEn: "Severe Cleanliness Issue / Uninhabitable" },
  { id: "SAFETY", labelId: "Masalah Keamanan & Keselamatan Properti", labelEn: "Safety & Security Concern" },
  { id: "OTHER", labelId: "Masalah Lainnya", labelEn: "Other Issue" },
]

export default function ReportDisputeModal({
  booking,
  currentLang = "id",
  trigger,
}: ReportDisputeModalProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")

  const [selectedReason, setSelectedReason] = useState(DISPUTE_REASONS[0].id)
  const [description, setDescription] = useState("")
  const [evidenceInput, setEvidenceInput] = useState("")
  const [evidenceUrls, setEvidenceUrls] = useState<string[]>([])

  const router = useRouter()
  const [now] = useState(() => Date.now())

  // Hitung batas waktu garansi komplain (24 jam sejak check-in resmi 14:00 WIB)
  const deadline = booking.escrowReleaseAt 
    ? new Date(booking.escrowReleaseAt) 
    : toEscrowReleaseDateTimeWIB(booking.startDate)

  const diffMs = deadline.getTime() - now
  const remainingHours = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)))
  const remainingMinutes = Math.max(0, Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60)))

  const handleAddEvidenceUrl = () => {
    if (!evidenceInput.trim()) return
    setEvidenceUrls(prev => [...prev, evidenceInput.trim()])
    setEvidenceInput("")
  }

  const handleRemoveEvidence = (index: number) => {
    setEvidenceUrls(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmitDispute = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg("")

    if (!description.trim()) {
      setErrorMsg(currentLang === "en" ? "Please provide a detailed description of the issue." : "Mohon jelaskan secara detail masalah yang Anda hadapi.")
      return
    }

    setLoading(true)
    try {
      const selectedReasonObj = DISPUTE_REASONS.find(r => r.id === selectedReason)
      const reasonLabel = currentLang === "en" ? selectedReasonObj?.labelEn : selectedReasonObj?.labelId

      const res = await fetch("/api/disputes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: booking.id,
          reason: reasonLabel || selectedReason,
          description: description.trim(),
          evidenceUrls
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Gagal mengajukan laporan sengketa")

      toast({
        variant: "success",
        title: currentLang === "en" ? "Dispute Submitted" : "Sengketa Diajukan",
        description: currentLang === "en" 
          ? "Dispute reported successfully. Escrow payout has been frozen pending Admin investigation." 
          : "Laporan sengketa berhasil diajukan. Penyaluran dana escrow telah dibekukan sementara hingga investigasi Admin."
      })

      setOpen(false)
      router.refresh()
    } catch (err) {
      const msg = err instanceof Error ? err.message : ""
      setErrorMsg(msg || "Terjadi kesalahan saat melaporkan sengketa")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <DialogTrigger render={trigger} />
      ) : (
        <DialogTrigger className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 font-bold text-xs transition-colors cursor-pointer">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>{currentLang === "en" ? "Report Stay Issue" : "Laporkan Masalah Menginap"}</span>
        </DialogTrigger>
      )}

      <DialogContent className="max-w-lg p-6 sm:p-7 rounded-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-1.5 pb-2">
          <div className="w-11 h-11 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center mb-1">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <DialogTitle className="text-xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            {currentLang === "en" ? "Report Stay Issue (Escrow Protection)" : "Laporkan Masalah (Perlindungan Escrow)"}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
            {currentLang === "en"
              ? "If the accommodation does not match the description, submit your claim within 24 hours of check-in to freeze the escrow funds."
              : "Jika penginapan tidak sesuai atau kunci tidak dapat diakses, ajukan komplain dalam 24 jam pertama check-in untuk membekukan dana."}
          </DialogDescription>
        </DialogHeader>

        {/* Countdown Window Banner */}
        <div className="p-3 rounded-2xl bg-linear-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 text-xs space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-semibold">
              <Clock className="w-4 h-4 text-amber-500 shrink-0" />
              <span>{currentLang === "en" ? "Remaining Guarantee Window:" : "Sisa Batas Garansi Sengketa:"}</span>
            </div>
            <span className="font-mono font-bold text-amber-900 dark:text-amber-200 bg-amber-100 dark:bg-amber-900/60 px-2 py-0.5 rounded-lg">
              {remainingHours}j {remainingMinutes}m
            </span>
          </div>
          <div className="text-[10px] text-muted-foreground pl-6">
            {currentLang === "en" ? "Dispute closes at: " : "Batas pengajuan: "}
            <span className="font-medium text-gray-700 dark:text-gray-300">{formatWibDateTime(deadline, currentLang === "en" ? "en" : "id")}</span>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmitDispute} className="space-y-4 pt-1 text-xs">
          {/* Kategori Keluhan */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">
              {currentLang === "en" ? "Issue Category" : "Kategori Masalah"}
            </label>
            <select
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-xs font-medium outline-none focus:border-rose-500"
            >
              {DISPUTE_REASONS.map(r => (
                <option key={r.id} value={r.id}>
                  {currentLang === "en" ? r.labelEn : r.labelId}
                </option>
              ))}
            </select>
          </div>

          {/* Deskripsi Keluhan */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">
              {currentLang === "en" ? "Explain the Problem in Detail" : "Jelaskan Kendala Secara Detail"}
            </label>
            <textarea
              required
              rows={3}
              placeholder={currentLang === "en" 
                ? "Describe what happened, attempts to contact the host, and condition of the property..." 
                : "Tuliskan kronologi, upaya menghubungi tuan rumah, dan kondisi fisik properti saat tiba..."}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-xs font-medium outline-none focus:border-rose-500"
            />
          </div>

          {/* Bukti Foto (Evidence URLs) */}
          <div className="space-y-2">
            <label className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">
              {currentLang === "en" ? "Photo Evidence (URLs)" : "Foto Bukti Kejadian (Link Gambar)"}
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                placeholder="https://... (Link foto bukti)"
                value={evidenceInput}
                onChange={(e) => setEvidenceInput(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-xs font-medium outline-none focus:border-rose-500"
              />
              <Button
                type="button"
                onClick={handleAddEvidenceUrl}
                variant="outline"
                className="rounded-xl text-xs"
              >
                {currentLang === "en" ? "Add Link" : "Tambah"}
              </Button>
            </div>

            {evidenceUrls.length > 0 && (
              <div className="space-y-1.5 pt-1">
                {evidenceUrls.map((url, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-[11px]">
                    <span className="truncate flex-1 mr-2 font-mono text-muted-foreground">{url}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveEvidence(idx)}
                      className="text-rose-500 hover:text-rose-700 cursor-pointer p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Catatan Kebijakan Escrow */}
          <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-[11px] text-blue-700 dark:text-blue-300 flex items-start gap-2">
            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <p>
              {currentLang === "en"
                ? "Upon submitting, payout to Host will be paused immediately. Ruang Rehat Admin will review the evidence and contact both parties."
                : "Begitu diajukan, pencairan dana ke Host otomatis dibekukan. Tim Admin Ruang Rehat akan menginvestigasi bukti dan menentukan solusi pengembalian dana."}
            </p>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={() => setOpen(false)}
              className="rounded-xl text-xs"
            >
              {currentLang === "en" ? "Close" : "Batal"}
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold"
            >
              {loading ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>{currentLang === "en" ? "Submitting..." : "Mengirimkan..."}</span>
                </span>
              ) : (
                currentLang === "en" ? "Submit Dispute Claim" : "Kirim Laporan Sengketa"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
