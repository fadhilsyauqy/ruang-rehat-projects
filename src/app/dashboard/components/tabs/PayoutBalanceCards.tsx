import React from "react"
import { Wallet, Clock, ArrowDownToLine, AlertCircle, ShieldCheck } from "lucide-react"
import { formatPrice } from "@/lib/format"
import type { Dictionary } from "@/lib/dictionary"

export interface PayoutBalanceCardsProps {
  availablePayoutIdr: number
  escrowIdr: number
  totalWithdrawnIdr: number
  currentCurrency?: string
  t: Partial<Dictionary>
}

export default function PayoutBalanceCards({
  availablePayoutIdr,
  escrowIdr,
  totalWithdrawnIdr,
  currentCurrency = "IDR",
  t,
}: PayoutBalanceCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {/* 1. Saldo Siap Ditarik */}
      <div className="p-6 rounded-3xl bg-linear-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20 bg-white dark:bg-gray-900 shadow-xs relative overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 tracking-wide uppercase">
            {t.readyToWithdraw}
          </span>
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <Wallet className="w-5 h-5" />
          </div>
        </div>
        <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-gray-100">
          {formatPrice(availablePayoutIdr, currentCurrency)}
        </h3>
        <p className="text-[11px] text-muted-foreground mt-2 flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <span>
            {t.readyToWithdrawDesc ||
              "Dana dari tamu yang sudah menyelesaikan masa tinggal (check-out)."}
          </span>
        </p>
      </div>

      {/* 2. Saldo Tertahan (Escrow) */}
      <div className="p-6 rounded-3xl bg-linear-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 bg-white dark:bg-gray-900 shadow-xs relative overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-amber-600 dark:text-amber-400 tracking-wide uppercase">
            {t.escrowBalance}
          </span>
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>
        <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-gray-100">
          {formatPrice(escrowIdr, currentCurrency)}
        </h3>
        <p className="text-[11px] text-muted-foreground mt-2 flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span>
            {t.escrowBalanceDesc ||
              "Ditahan sementara di platform hingga tamu selesai check-out."}
          </span>
        </p>
      </div>

      {/* 3. Total Dicairkan */}
      <div className="p-6 rounded-3xl bg-linear-to-br from-blue-500/10 via-blue-500/5 to-transparent border border-blue-500/20 bg-white dark:bg-gray-900 shadow-xs relative overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-blue-600 dark:text-blue-400 tracking-wide uppercase">
            {t.totalWithdrawn}
          </span>
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
            <ArrowDownToLine className="w-5 h-5" />
          </div>
        </div>
        <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-gray-100">
          {formatPrice(totalWithdrawnIdr, currentCurrency)}
        </h3>
        <p className="text-[11px] text-muted-foreground mt-2">
          {t.totalWithdrawnDesc ||
            "Total akumulasi dana yang telah berhasil ditransfer ke rekening bank Anda."}
        </p>
      </div>
    </div>
  )
}
