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
                      {p.status === "PENDING" && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                          {t.payoutStatusPending || "Menunggu"}
                        </span>
                      )}
                      {p.status === "PROCESSING" && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                          {t.payoutStatusProcessing || "Diproses"}
                        </span>
                      )}
                      {p.status === "COMPLETED" && (
                        <div className="space-y-1">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 inline-block">
                            {t.payoutStatusCompleted || "Berhasil"}
                          </span>
                          {p.notes && p.notes.includes("[No. Ref:") && (
                            <p className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
                              {p.notes.match(/\[No\. Ref: [^\]]+\]/)?.[0]}
                            </p>
                          )}
                        </div>
                      )}
                      {p.status === "FAILED" && (
                        <div className="space-y-1 max-w-xs">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800 inline-block">
                            {t.payoutStatusFailed || "Gagal"}
                          </span>
                          {p.notes && (
                            <div className="text-[11px] text-rose-600 dark:text-rose-400 bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-900/40 rounded-lg p-1.5 leading-snug">
                              <span className="font-semibold">Alasan: </span>
                              <span>
                                {p.notes.includes("[Admin]:")
                                  ? p.notes.split("[Admin]:")[1]?.trim()
                                  : p.notes}
                              </span>
                              <span className="block text-[10px] text-rose-500/80 mt-0.5">
                                (Saldo telah dikembalikan)
                              </span>
                            </div>
                          )}
                        </div>
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
