import React from "react"
import { CheckCircle2 } from "lucide-react"
import type { Dictionary } from "@/lib/dictionary"
import type { Payout } from "@/types"

export interface PayoutReceiptData extends Payout {
  displayAmount: string
}

export interface PayoutReceiptDialogProps {
  receipt: PayoutReceiptData | null
  onClose: () => void
  currentLang?: string
  t: Partial<Dictionary>
}

export default function PayoutReceiptDialog({
  receipt,
  onClose,
  currentLang = "id",
  t,
}: PayoutReceiptDialogProps) {
  if (!receipt) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-6 text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-500 mx-auto flex items-center justify-center">
          <CheckCircle2 className="w-9 h-9" />
        </div>

        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-full">
            {currentLang === "en" ? "Transfer Successfully Processed" : "Transfer Berhasil Diproses"}
          </span>
          <h3 className="text-2xl font-black text-gray-900 dark:text-gray-100 mt-3">
            {receipt.displayAmount}
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            {t.payoutSuccessCompletedNotice || "Dana telah berhasil dikirimkan ke rekening bank Anda."}
          </p>
        </div>

        {/* Transfer Receipt Details Box */}
        <div className="bg-gray-50 dark:bg-gray-800/60 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 text-left space-y-2 text-xs">
          <div className="flex justify-between text-muted-foreground">
            <span>No. Referensi:</span>
            <span className="font-mono font-bold text-gray-900 dark:text-gray-100">
              PAY-{receipt.id.slice(-8).toUpperCase()}
            </span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Waktu Transaksi:</span>
            <span className="text-gray-900 dark:text-gray-100">
              {new Date(receipt.createdAt).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Bank Tujuan:</span>
            <span className="font-bold text-gray-900 dark:text-gray-100">
              {receipt.bankName} ({receipt.accountNumber})
            </span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Penerima:</span>
            <span className="font-bold text-gray-900 dark:text-gray-100">{receipt.accountHolder}</span>
          </div>
          <div className="flex justify-between text-muted-foreground border-t border-gray-200 dark:border-gray-700 pt-2">
            <span>Status:</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">SELESAI (COMPLETED)</span>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-gray-900 hover:bg-black dark:bg-gray-100 dark:hover:bg-white text-white dark:text-gray-900 font-bold text-xs transition-all cursor-pointer shadow-sm"
        >
          {currentLang === "en" ? "Close Receipt" : "Tutup Resi"}
        </button>
      </div>
    </div>
  )
}
