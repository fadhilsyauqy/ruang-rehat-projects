import React from "react"
import { ShieldCheck, ExternalLink } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export interface KtpPreviewDialogProps {
  previewUrl: string | null
  onClose: () => void
  currentLang?: string
}

export default function KtpPreviewDialog({
  previewUrl,
  onClose,
  currentLang = "id",
}: KtpPreviewDialogProps) {
  if (!previewUrl) return null

  return (
    <Dialog open={!!previewUrl} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl p-6 rounded-3xl">
        <DialogHeader className="flex flex-row items-center justify-between pb-2">
          <DialogTitle className="text-base font-bold flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-purple-600" />
            <span>
              {currentLang === "en"
                ? "Official ID / Passport Document Preview"
                : "Pratinjau Dokumen KTP / Paspor Resmi"}
            </span>
          </DialogTitle>
        </DialogHeader>
        <div className="relative rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 bg-black flex items-center justify-center min-h-[350px] max-h-[70vh]">
          <img
            src={previewUrl}
            alt="Pratinjau Dokumen KTP"
            className="max-h-[68vh] w-auto max-w-full object-contain"
          />
        </div>
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-muted-foreground">
            {currentLang === "en"
              ? "Verify photo authenticity, ID number clarity, full name, and birth date."
              : "Periksa keaslian foto, kejelasan NIK, nama lengkap, dan tanggal lahir."}
          </span>
          <a
            href={previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-xl bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 text-purple-700 dark:text-purple-300 text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            {currentLang === "en" ? "Open Original Size" : "Buka Ukuran Asli"}
          </a>
        </div>
      </DialogContent>
    </Dialog>
  )
}
