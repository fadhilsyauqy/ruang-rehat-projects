import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Search, ShieldCheck, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { formatPrice } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { AdminPayoutItem } from "@/types"
import PayoutConfirmDialog from "../dialogs/PayoutConfirmDialog"

export interface PayoutsTabProps {
  initialPayouts: AdminPayoutItem[]
  currentCurrency?: string
  currentLang?: string
}

export default function PayoutsTab({
  initialPayouts,
  currentCurrency = "IDR",
  currentLang = "id",
}: PayoutsTabProps) {
  const router = useRouter()
  const [payoutsList, setPayoutsList] = useState<AdminPayoutItem[]>(initialPayouts)
  const [userSearch, setUserSearch] = useState("")
  const [payoutStatusFilter, setPayoutStatusFilter] = useState("ALL")
  const [loadingAction, setLoadingAction] = useState<string | null>(null)
  const [selectedPayoutForApproval, setSelectedPayoutForApproval] =
    useState<AdminPayoutItem | null>(null)

  useEffect(() => {
    setPayoutsList(initialPayouts)
  }, [initialPayouts])

  const handleUpdatePayout = async (
    payoutId: string,
    status: "COMPLETED" | "FAILED" | "PROCESSING",
    notes?: string,
    referenceNumber?: string
  ) => {
    setLoadingAction(`payout-${payoutId}`)
    try {
      const res = await fetch(`/api/admin/payouts/${payoutId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, notes, referenceNumber }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Gagal memperbarui status payout")

      if (data.payout) {
        setPayoutsList((prev) =>
          prev.map((p) =>
            p.id === data.payout.id ? { ...p, ...data.payout } : p
          )
        )
      }
      setSelectedPayoutForApproval(null)
      router.refresh()
    } catch (err: unknown) {
      const error = err as Error
      alert(error.message)
    } finally {
      setLoadingAction(null)
    }
  }

  const filteredPayouts = payoutsList.filter((p) => {
    if (payoutStatusFilter !== "ALL" && p.status !== payoutStatusFilter)
      return false
    const q = userSearch.toLowerCase()
    return (
      p.user?.name?.toLowerCase().includes(q) ||
      p.user?.email?.toLowerCase().includes(q) ||
      p.bankName?.toLowerCase().includes(q) ||
      p.accountNumber?.toLowerCase().includes(q) ||
      p.notes?.toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-6">
      {/* Top Banner Payout Rules */}
      <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 text-xs text-blue-900 dark:text-blue-200 flex items-center gap-3">
        <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0" />
        <span>
          <strong>Protokol Pencairan Dana:</strong> Penarikan host hanya
          bersumber dari dana sewa yang telah berstatus <strong>RELEASED</strong>{" "}
          (24 jam setelah check-in tamu). Dana berstatus HELD tidak dapat
          dicairkan demi melindungi hak konsumen.
        </span>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white dark:bg-gray-900 p-4 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Cari host, bank, no rekening..."
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            className="pl-9 rounded-2xl text-xs"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-muted-foreground shrink-0">
            Filter Status:
          </span>
          <select
            value={payoutStatusFilter}
            onChange={(e) => setPayoutStatusFilter(e.target.value)}
            className="h-9 px-3 rounded-xl border border-gray-200 dark:border-gray-800 text-xs bg-white dark:bg-gray-900 font-medium cursor-pointer"
          >
            <option value="ALL">Semua Status</option>
            <option value="PENDING">PENDING (Menunggu)</option>
            <option value="PROCESSING">PROCESSING (Diproses Bank)</option>
            <option value="COMPLETED">COMPLETED (Selesai Ditransfer)</option>
            <option value="FAILED">FAILED (Ditolak / Gagal)</option>
          </select>
        </div>
      </div>

      {/* Payouts List */}
      <div className="space-y-4">
        {filteredPayouts.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 text-muted-foreground text-xs">
            Tidak ada data permohonan penarikan dana sesuai filter.
          </div>
        ) : (
          filteredPayouts.map((payout) => (
            <div
              key={payout.id}
              className="p-5 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xs hover:shadow-md transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-6"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono font-bold text-gray-500">
                    #{payout.id.substring(0, 8)}
                  </span>
                  <span
                    className={cn(
                      "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase",
                      payout.status === "COMPLETED"
                        ? "bg-emerald-100 text-emerald-800"
                        : payout.status === "PROCESSING"
                        ? "bg-blue-100 text-blue-800"
                        : payout.status === "FAILED"
                        ? "bg-rose-100 text-rose-800"
                        : "bg-amber-100 text-amber-800"
                    )}
                  >
                    {payout.status}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(payout.createdAt).toLocaleString(
                      currentLang === "en" ? "en-US" : "id-ID",
                      { dateStyle: "medium", timeStyle: "short" }
                    )}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100">
                    {payout.user?.name || payout.user?.email || "Host"}
                  </h4>
                  <span className="text-xs text-muted-foreground">
                    ({payout.user?.email})
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600 dark:text-gray-400">
                  <span>
                    Tujuan: <strong>{payout.bankName}</strong>
                  </span>
                  <span>
                    No Rekening: <strong>{payout.accountNumber}</strong>
                  </span>
                  <span>
                    Atas Nama: <strong>{payout.accountHolder}</strong>
                  </span>
                </div>

                {payout.notes && (
                  <div className="flex items-start gap-2 text-[11px] text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/40 p-2.5 rounded-xl border border-gray-150 dark:border-gray-800 max-w-xl">
                    <span className="font-bold text-gray-700 dark:text-gray-200 shrink-0">
                      Catatan / No. Ref:
                    </span>
                    <span className="font-mono">{payout.notes}</span>
                  </div>
                )}

                {payout.status === "COMPLETED" && payout.processedAt && (
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>
                      Selesai Ditransfer:{" "}
                      {new Date(payout.processedAt).toLocaleString(
                        currentLang === "en" ? "en-US" : "id-ID",
                        { dateStyle: "medium", timeStyle: "short" }
                      )}
                    </span>
                  </p>
                )}
              </div>

              {/* Financial & Status Controls */}
              <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end justify-between gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-gray-100 dark:border-gray-800">
                <div className="text-left sm:text-right">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                    Nominal Dicairkan
                  </p>
                  <h3 className="text-xl font-black text-gray-900 dark:text-gray-100">
                    {formatPrice(payout.amount, currentCurrency)}
                  </h3>
                </div>

                {/* Action buttons - Hanya aktif untuk status PENDING & PROCESSING */}
                <div className="flex items-center gap-2">
                  {(payout.status === "PENDING" || payout.status === "PROCESSING") && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => setSelectedPayoutForApproval(payout)}
                        disabled={loadingAction === `payout-${payout.id}`}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold h-8 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                        Setujui & Selesai
                      </Button>

                      {payout.status === "PENDING" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdatePayout(payout.id, "PROCESSING")}
                          disabled={loadingAction === `payout-${payout.id}`}
                          className="border-blue-200 text-blue-600 hover:bg-blue-50 rounded-xl text-xs font-semibold h-8 cursor-pointer"
                        >
                          Tandai Proses
                        </Button>
                      )}

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          const reason = prompt(
                            "Masukkan alasan penolakan/pembekuan pencairan dana:"
                          )
                          if (reason)
                            handleUpdatePayout(payout.id, "FAILED", reason)
                        }}
                        disabled={loadingAction === `payout-${payout.id}`}
                        className="text-rose-600 hover:bg-rose-50 text-xs h-8 cursor-pointer"
                      >
                        Tolak
                      </Button>
                    </>
                  )}

                  {payout.status === "COMPLETED" && (
                    <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-full border border-emerald-200/50">
                      ✓ Transaksi Selesai
                    </span>
                  )}

                  {payout.status === "FAILED" && (
                    <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-3 py-1 rounded-full border border-rose-200/50">
                      ✗ Permohonan Ditolak
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Dialog Konfirmasi Pencairan Dana dengan Nomor Referensi Bank */}
      <PayoutConfirmDialog
        payout={selectedPayoutForApproval}
        onClose={() => setSelectedPayoutForApproval(null)}
        onConfirmPayout={async (payoutId, referenceNumber, notes) => {
          await handleUpdatePayout(payoutId, "COMPLETED", notes, referenceNumber)
        }}
        loading={Boolean(
          selectedPayoutForApproval &&
            loadingAction === `payout-${selectedPayoutForApproval.id}`
        )}
        currentCurrency={currentCurrency}
        currentLang={currentLang}
      />
    </div>
  )
}
