import React from "react"
import { Clock, Landmark } from "lucide-react"
import { formatPrice } from "@/lib/format"
import type { Dictionary } from "@/lib/dictionary"
import type { Payout } from "@/types"

export interface PayoutHistoryTableProps {
  payoutsList: Payout[]
  currentCurrency?: string
  t: Partial<Dictionary>
}

export default function PayoutHistoryTable({
  payoutsList,
  currentCurrency = "IDR",
  t,
}: PayoutHistoryTableProps) {
  return (
    <div className="space-y-4">
      <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
        <Clock className="w-4 h-4 text-gray-400" />
        <span>{t.payoutHistory}</span>
      </h4>

      {payoutsList.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-gray-200 dark:border-gray-800 p-10 text-center bg-gray-50/50 dark:bg-gray-900/30">
          <Landmark className="w-10 h-10 text-gray-400 mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">{t.noPayoutHistory}</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-gray-800/60 border-b border-gray-100 dark:border-gray-800 text-muted-foreground font-semibold">
                <tr>
                  <th className="px-4 py-3">ID Transaksi</th>
                  <th className="px-4 py-3">Tanggal</th>
                  <th className="px-4 py-3">Tujuan Transfer</th>
                  <th className="px-4 py-3">Nominal</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {payoutsList.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40 transition-colors"
                  >
                    <td className="px-4 py-3 font-mono font-bold text-[11px] text-gray-900 dark:text-gray-100">
                      PAY-{p.id.slice(-8).toUpperCase()}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(p.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                        {p.bankName}
                      </span>
                      <span className="text-muted-foreground ml-1.5 font-mono text-[11px]">
                        {p.accountNumber}
                      </span>
                      <div className="text-[10px] text-muted-foreground">
                        {p.accountHolder}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-bold text-gray-900 dark:text-gray-100">
                      {formatPrice(p.amount, currentCurrency)}
                    </td>
                    <td className="px-4 py-3">
                      {p.status === "COMPLETED" && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                          {t.payoutStatusCompleted}
                        </span>
                      )}
                      {p.status === "PROCESSING" && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                          {t.payoutStatusProcessing}
                        </span>
                      )}
                      {p.status === "FAILED" && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                          {t.payoutStatusFailed}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
