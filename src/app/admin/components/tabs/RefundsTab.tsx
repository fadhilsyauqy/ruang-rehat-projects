import React, { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Search,
  CheckCircle2,
  Banknote,
  Copy,
  Check,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { formatPrice } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { AdminBookingItem } from "@/types"
import RefundConfirmDialog from "../dialogs/RefundConfirmDialog"
import { toast } from "@/components/ui/use-toast"
import EmptyState from "@/components/ui/EmptyState"

export type RefundItem = AdminBookingItem

export interface RefundsTabProps {
  refundsList: RefundItem[]
  onRefundConfirmed?: (booking: RefundItem) => void
  currentCurrency?: string
  currentLang?: string
}

export default function RefundsTab({
  refundsList,
  onRefundConfirmed,
  currentCurrency = "IDR",
  currentLang = "id",
}: RefundsTabProps) {
  const router = useRouter()
  const [userSearch, setUserSearch] = useState("")
  const [refundFilter, setRefundFilter] = useState("ALL")
  const [copiedAcc, setCopiedAcc] = useState<string | null>(null)
  const [selectedRefundBooking, setSelectedRefundBooking] = useState<RefundItem | null>(null)
  const [loadingAction, setLoadingAction] = useState<string | null>(null)

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedAcc(id)
    setTimeout(() => setCopiedAcc(null), 2000)
  }

  const handleConfirmRefund = async (bookingId: string, proofUrl: string) => {
    setLoadingAction(`refund-${bookingId}`)
    try {
      const res = await fetch(`/api/admin/refunds/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "COMPLETED",
          refundProofUrl: proofUrl || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok)
        throw new Error(data.error || "Gagal mengonfirmasi pengembalian dana")

      if (onRefundConfirmed && selectedRefundBooking) {
        onRefundConfirmed({
          ...selectedRefundBooking,
          refundStatus: "COMPLETED",
          refundProofUrl: proofUrl || null,
          refundedAt: new Date(),
        })
      }
      toast({
        variant: "success",
        title: currentLang === "en" ? "Refund Confirmed" : "Pengembalian Dana Dikonfirmasi",
        description:
          currentLang === "en"
            ? "Guest refund marked as completed."
            : "Pengembalian dana tamu berhasil ditandai selesai.",
      })
      setSelectedRefundBooking(null)
      router.refresh()
    } catch (err: unknown) {
      const error = err as Error
      toast({
        variant: "destructive",
        title: currentLang === "en" ? "Refund Failed" : "Gagal Mengonfirmasi",
        description: error.message,
      })
    } finally {
      setLoadingAction(null)
    }
  }

  const filteredRefunds = refundsList.filter((b) => {
    if (refundFilter !== "ALL" && b.refundStatus !== refundFilter) return false
    const q = userSearch.toLowerCase()
    return (
      b.id?.toLowerCase().includes(q) ||
      b.property?.title?.toLowerCase().includes(q) ||
      b.refundBankName?.toLowerCase().includes(q) ||
      b.refundAccountNumber?.toLowerCase().includes(q) ||
      b.refundAccountHolder?.toLowerCase().includes(q) ||
      b.guest?.name?.toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white dark:bg-gray-900 p-4 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Cari rekening, nama tamu, properti..."
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            className="pl-9 rounded-2xl text-xs"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-muted-foreground shrink-0">
            Status Transfer:
          </span>
          <select
            value={refundFilter}
            onChange={(e) => setRefundFilter(e.target.value)}
            className="h-9 px-3 rounded-xl border border-gray-200 dark:border-gray-800 text-xs bg-white dark:bg-gray-900 font-medium cursor-pointer"
          >
            <option value="ALL">Semua Antrean</option>
            <option value="PENDING_ADMIN_TRANSFER">
              PENDING (Menunggu Transfer Manual)
            </option>
            <option value="COMPLETED">COMPLETED (Selesai Ditransfer)</option>
          </select>
        </div>
      </div>

      {/* Refunds List */}
      <div className="space-y-4">
        {filteredRefunds.length === 0 ? (
          <EmptyState
            icon={Banknote}
            title={
              currentLang === "en"
                ? "No refunds found"
                : "Tidak ada antrean refund"
            }
            description={
              userSearch || refundFilter !== "ALL"
                ? currentLang === "en"
                  ? "No refund requests match your search or filter criteria."
                  : "Tidak ada antrean pengembalian dana yang cocok dengan filter."
                : currentLang === "en"
                ? "All eligible guest refunds have been processed successfully."
                : "Seluruh permohonan pengembalian dana tamu telah selesai diproses."
            }
            actionLabel={
              userSearch || refundFilter !== "ALL"
                ? currentLang === "en"
                  ? "Reset Filter"
                  : "Reset Filter"
                : undefined
            }
            onAction={() => {
              setUserSearch("")
              setRefundFilter("ALL")
            }}
          />
        ) : (
          filteredRefunds.map((b) => (
            <div
              key={b.id}
              className="p-5 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xs hover:shadow-md transition-all space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="font-mono text-xs font-bold text-gray-500">
                    #{b.id.substring(0, 10)}
                  </span>
                  <span
                    className={cn(
                      "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase",
                      b.refundStatus === "COMPLETED"
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                        : b.refundStatus === "PENDING_ADMIN_TRANSFER"
                        ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                        : "bg-gray-100 text-gray-800"
                    )}
                  >
                    {b.refundStatus === "PENDING_ADMIN_TRANSFER"
                      ? "Menunggu Transfer Manual (BI-FAST)"
                      : b.refundStatus === "COMPLETED"
                      ? "Selesai Ditransfer"
                      : b.refundStatus}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {b.cancelledByRole
                      ? `Dibatalkan oleh: ${b.cancelledByRole}`
                      : "Refund"}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    Nominal Refund:
                  </span>
                  <span className="font-extrabold text-base text-emerald-600 dark:text-emerald-400">
                    {formatPrice(b.refundAmountIdr || 0, currentCurrency)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Detail Tamu & Alasan */}
                <div className="space-y-2">
                  <div className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800 space-y-1.5">
                    <p className="font-bold text-gray-900 dark:text-gray-100">
                      {b.guest?.name || "Tamu"}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {b.guest?.email} · {b.guest?.phoneNumber || "Tanpa No HP"}
                    </p>
                    <p className="text-[11px] font-medium text-rose-600 truncate">
                      {b.property?.title}
                    </p>
                  </div>

                  {b.cancelReason && (
                    <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 text-[11px] text-muted-foreground">
                      <span className="font-semibold text-gray-700 dark:text-gray-300">
                        Alasan:{" "}
                      </span>
                      <span>{b.cancelReason}</span>
                    </div>
                  )}
                </div>

                {/* Rekening Tujuan Transfer */}
                <div className="p-3.5 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-900/40 space-y-2 flex flex-col justify-between">
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-purple-900 dark:text-purple-200 block">
                      Rekening Bank Tujuan Tamu:
                    </span>
                    <p className="font-semibold text-gray-900 dark:text-gray-100 text-xs">
                      {b.refundBankName || "Bank belum ditentukan"}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-gray-900 dark:text-gray-100 tracking-wider">
                        {b.refundAccountNumber || "-"}
                      </span>
                      {b.refundAccountNumber && (
                        <button
                          type="button"
                          onClick={() =>
                            copyToClipboard(b.refundAccountNumber!, b.id)
                          }
                          className="px-2 py-0.5 rounded-md bg-white dark:bg-gray-800 border border-purple-200 dark:border-purple-800 text-[10px] font-semibold text-purple-700 dark:text-purple-300 hover:bg-purple-100 flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          {copiedAcc === b.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span>Tersalin</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Salin</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      a.n.{" "}
                      <strong className="text-gray-900 dark:text-gray-100">
                        {b.refundAccountHolder || "-"}
                      </strong>
                    </p>
                  </div>

                  {/* Tombol Eksekusi Transfer */}
                  <div className="pt-2 border-t border-purple-200/50 dark:border-purple-900/40 flex items-center justify-between">
                    {b.refundStatus === "COMPLETED" ? (
                      <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>
                          Ditransfer:{" "}
                          {b.refundedAt
                            ? new Date(b.refundedAt).toLocaleDateString("id-ID")
                            : "Selesai"}
                        </span>
                      </div>
                    ) : (
                      <Button
                        onClick={() => setSelectedRefundBooking(b)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold w-full sm:w-auto cursor-pointer"
                      >
                        <Banknote className="w-3.5 h-3.5 mr-1.5" />
                        Tandai Sudah Ditransfer (BI-FAST)
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Konfirmasi Transfer Refund */}
      <RefundConfirmDialog
        booking={selectedRefundBooking}
        onClose={() => setSelectedRefundBooking(null)}
        onConfirmRefund={handleConfirmRefund}
        loading={loadingAction === `refund-${selectedRefundBooking?.id}`}
        currentCurrency={currentCurrency}
      />
    </div>
  )
}
