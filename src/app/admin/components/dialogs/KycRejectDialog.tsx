import React from "react"
import { Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import type { Dictionary } from "@/lib/dictionary"
import type { AdminUserItem } from "@/types"

export interface KycRejectDialogProps {
  user: AdminUserItem | null
  onClose: () => void
  onConfirmReject: (userId: string, reason: string) => Promise<void>
  loading: boolean
  currentLang?: string
  t: Partial<Dictionary>
}

export default function KycRejectDialog({
  user,
  onClose,
  onConfirmReject,
  loading,
  currentLang = "id",
  t,
}: KycRejectDialogProps) {
  const [rejectReason, setRejectReason] = React.useState("")

  React.useEffect(() => {
    if (user) {
      setRejectReason("")
    }
  }, [user])

  if (!user) return null

  return (
    <Dialog open={!!user} onOpenChange={(open) => !open && !loading && onClose()}>
      <DialogContent className="rounded-3xl max-w-md">
        <DialogHeader>
          <DialogTitle>
            {currentLang === "en"
              ? "Reject Host KYC Verification"
              : "Tolak Verifikasi KYC Host"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2 text-xs">
          <p className="text-muted-foreground leading-relaxed">
            {currentLang === "en"
              ? `Provide a rejection reason to `
              : `Beri tahu alasan penolakan kepada `}
            <strong>{user.name || user.email}</strong>
            {currentLang === "en"
              ? ` so the host can resubmit corrected documents:`
              : ` agar host dapat memperbaiki dokumen:`}
          </p>
          <textarea
            rows={3}
            disabled={loading}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder={
              currentLang === "en"
                ? "e.g., Blurry ID photo, name mismatch, or invalid ID number..."
                : "Contoh: Foto KTP buram, nama pemilik rekening tidak sesuai identitas resmi, atau NIK tidak valid..."
            }
            className="w-full p-3 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-xs focus:outline-none focus:border-purple-500 disabled:opacity-60 disabled:cursor-not-allowed"
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl text-xs disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t.cancel || (currentLang === "en" ? "Cancel" : "Batal")}
            </Button>
            <Button
              type="button"
              onClick={() => onConfirmReject(user.id, rejectReason)}
              disabled={loading}
              className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{currentLang === "en" ? "Rejecting..." : "Menolak..."}</span>
                </>
              ) : currentLang === "en" ? (
                "Confirm Rejection"
              ) : (
                "Konfirmasi Penolakan"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
