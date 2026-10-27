import React from "react"
import { Landmark, AlertCircle, CheckCircle2, Loader2 } from "lucide-react"
import { formatPrice } from "@/lib/format"
import type { Dictionary } from "@/lib/dictionary"
import type { HostBankAccount } from "@prisma/client"

export interface WithdrawConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  loading: boolean
  bankAccount: HostBankAccount | { bankName: string; accountNumber: string; accountHolder: string } | null
  withdrawAmount: string | number
  currentCurrency?: string
  currentLang?: string
  t: Partial<Dictionary>
}

export default function WithdrawConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  loading,
  bankAccount,
  withdrawAmount,
  currentCurrency = "IDR",
  currentLang = "id",
  t,
}: WithdrawConfirmDialogProps) {
  if (!isOpen || !bankAccount) return null

  const amountNum = Number(withdrawAmount) || 0
  const amountInIdr = currentCurrency === "USD" ? Math.round(amountNum * 18051) : amountNum

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={() => {
        if (!loading) onClose()
      }}
    >
      <div
        className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-gray-100 dark:border-gray-800 pb-4">
          <div className="w-11 h-11 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-500 flex items-center justify-center shrink-0">
            <Landmark className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
              {currentLang === "en" ? "Confirm Payout Withdrawal" : "Konfirmasi Penarikan Dana"}
            </h3>
            <p className="text-xs text-muted-foreground">
              {currentLang === "en"
                ? "Check transfer details before processing to your bank account."
                : "Periksa rincian transfer sebelum memproses ke rekening bank Anda."}
            </p>
          </div>
        </div>

        {/* Transfer Slip Details */}
        <div className="space-y-3 bg-gray-50 dark:bg-gray-800/60 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 text-xs">
          <div className="flex justify-between items-center text-muted-foreground">
            <span>{currentLang === "en" ? "Destination Bank:" : "Bank Tujuan:"}</span>
            <span className="font-bold text-gray-900 dark:text-gray-100">{bankAccount.bankName}</span>
          </div>
          <div className="flex justify-between items-center text-muted-foreground">
            <span>{currentLang === "en" ? "Account Number:" : "Nomor Rekening:"}</span>
            <span className="font-mono font-bold text-gray-900 dark:text-gray-100">{bankAccount.accountNumber}</span>
          </div>
          <div className="flex justify-between items-center text-muted-foreground">
            <span>{currentLang === "en" ? "Account Holder:" : "Nama Pemilik:"}</span>
            <span className="font-bold text-gray-900 dark:text-gray-100">{bankAccount.accountHolder}</span>
          </div>
          <div className="flex justify-between items-center text-muted-foreground">
            <span>{currentLang === "en" ? "Transfer Method:" : "Metode Transfer:"}</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">BI-FAST (Real-time Instan)</span>
          </div>
          <div className="border-t border-gray-200 dark:border-gray-700 pt-2 flex justify-between items-center text-muted-foreground">
            <span>{t.serviceFee || (currentLang === "en" ? "Service Fee:" : "Biaya Layanan Admin:")}</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              {currentLang === "en" ? "Free ($0)" : "Rp 0 (Gratis)"}
            </span>
          </div>
          <div className="border-t border-gray-200 dark:border-gray-700 pt-2 flex justify-between items-center text-sm font-bold">
            <span className="text-gray-900 dark:text-gray-100">
              {currentLang === "en" ? "Total Transferred:" : "Total Ditransfer:"}
            </span>
            <span className="text-rose-600 dark:text-rose-400 text-base">
              {formatPrice(amountInIdr, currentCurrency)}
            </span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <span>
            {t.payoutWarningNotice ||
              "Pastikan nama pemilik rekening sesuai dengan buku tabungan Anda. Penarikan yang sudah diproses tidak dapat dibatalkan."}
          </span>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t.cancel || (currentLang === "en" ? "Cancel" : "Batal")}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className="px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold shadow-md shadow-rose-500/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            <span>
              {loading
                ? currentLang === "en"
                  ? "Processing Transfer..."
                  : "Memproses Transfer..."
                : currentLang === "en"
                  ? "Yes, Confirm & Withdraw"
                  : "Ya, Konfirmasi & Cairkan"}
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}
