import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { Search, AlertTriangle, ZoomIn, Scale } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { formatPrice } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { AdminDisputeItem } from "@/types"
import DisputeResolutionDialog, {
  type DisputeResolutionType,
} from "../dialogs/DisputeResolutionDialog"

export interface DisputesTabProps {
  disputesList: AdminDisputeItem[]
  onDisputeResolved?: (dispute: AdminDisputeItem) => void
  currentCurrency?: string
  currentLang?: string
}

export default function DisputesTab({
  disputesList,
  onDisputeResolved,
  currentCurrency = "IDR",
  currentLang = "id",
}: DisputesTabProps) {
  const router = useRouter()
  const [userSearch, setUserSearch] = useState("")
  const [disputeFilter, setDisputeFilter] = useState("ALL")
  const [selectedDispute, setSelectedDispute] = useState<AdminDisputeItem | null>(null)
  const [previewEvidenceUrl, setPreviewEvidenceUrl] = useState<string | null>(null)
  const [loadingAction, setLoadingAction] = useState<string | null>(null)

  const handleResolveDispute = async (params: {
    disputeId: string
    resolution: DisputeResolutionType
    adminNotes: string
    refundApprovedIdr?: number
    payoutApprovedIdr?: number
  }) => {
    setLoadingAction(`dispute-${params.disputeId}`)
    try {
      const res = await fetch(`/api/admin/disputes/${params.disputeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resolution: params.resolution,
          adminNotes: params.adminNotes,
          refundApprovedIdr: params.refundApprovedIdr,
          payoutApprovedIdr: params.payoutApprovedIdr,
        }),
      })
      const data = await res.json()
      if (!res.ok)
        throw new Error(data.error || "Gagal memproses resolusi sengketa")

      if (data.dispute && onDisputeResolved) {
        onDisputeResolved(data.dispute)
      }
      setSelectedDispute(null)
      router.refresh()
    } catch (err: unknown) {
      const error = err as Error
      alert(error.message)
    } finally {
      setLoadingAction(null)
    }
  }

  const filteredDisputes = disputesList.filter((d) => {
    if (disputeFilter !== "ALL" && d.status !== disputeFilter) return false
    const q = userSearch.toLowerCase()
    return (
      d.bookingId?.toLowerCase().includes(q) ||
      d.booking?.property?.title?.toLowerCase().includes(q) ||
      d.booking?.guest?.name?.toLowerCase().includes(q) ||
      d.reasonCategory?.toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white dark:bg-gray-900 p-4 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Cari sengketa, ID booking, tamu, properti..."
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            className="pl-9 rounded-2xl text-xs"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-muted-foreground shrink-0">
            Status Sengketa:
          </span>
          <select
            value={disputeFilter}
            onChange={(e) => setDisputeFilter(e.target.value)}
            className="h-9 px-3 rounded-xl border border-gray-200 dark:border-gray-800 text-xs bg-white dark:bg-gray-900 font-medium cursor-pointer"
          >
            <option value="ALL">Semua Sengketa</option>
            <option value="OPEN">OPEN (Menunggu Resolusi)</option>
            <option value="RESOLVED_RELEASE_TO_HOST">
              RESOLVED: Rilis ke Host
            </option>
            <option value="RESOLVED_FULL_REFUND">
              RESOLVED: Refund Penuh Tamu
            </option>
            <option value="RESOLVED_PARTIAL_REFUND">
              RESOLVED: Bagi Sebagian (Split)
            </option>
            <option value="REJECTED">REJECTED (Ditolak)</option>
          </select>
        </div>
      </div>

      {/* Disputes List */}
      <div className="space-y-4">
        {filteredDisputes.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 text-muted-foreground text-xs">
            Tidak ada laporan sengketa sesuai filter.
          </div>
        ) : (
          filteredDisputes.map((d) => {
            const bookingTotal =
              (d.booking?.totalPriceIdr ?? 0) > 0
                ? (d.booking?.totalPriceIdr ?? 0)
                : Math.round((d.booking?.totalPrice || 0) * 18051)

            return (
              <div
                key={d.id}
                className="p-5 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xs hover:shadow-md transition-all space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-mono text-xs font-bold text-gray-500">
                      #{d.id.substring(0, 8)}
                    </span>
                    <span
                      className={cn(
                        "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase",
                        d.status === "OPEN"
                          ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                          : d.status === "RESOLVED_FULL_REFUND"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                          : d.status === "RESOLVED_RELEASE_TO_HOST"
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300"
                          : d.status === "RESOLVED_PARTIAL_REFUND"
                          ? "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300"
                          : "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
                      )}
                    >
                      {d.status === "OPEN"
                        ? "Menunggu Resolusi Admin"
                        : d.status === "RESOLVED_FULL_REFUND"
                        ? "Refund 100% Tamu"
                        : d.status === "RESOLVED_RELEASE_TO_HOST"
                        ? "Rilis ke Host"
                        : d.status === "RESOLVED_PARTIAL_REFUND"
                        ? "Bagi Sebagian (Split)"
                        : "Ditolak"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(d.createdAt).toLocaleString(
                        currentLang === "en" ? "en-US" : "id-ID",
                        { dateStyle: "medium", timeStyle: "short" }
                      )}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">
                      Nilai Pesanan:
                    </span>
                    <span className="font-extrabold text-sm text-gray-900 dark:text-gray-100">
                      {formatPrice(bookingTotal, currentCurrency)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Pelapor & Pesanan */}
                  <div className="space-y-2">
                    <div className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800 space-y-2 text-xs">
                      <div className="flex items-center gap-2.5">
                        <Avatar className="w-8 h-8 rounded-full">
                          <AvatarImage
                            src={d.booking?.guest?.image || ""}
                          />
                          <AvatarFallback>
                            {d.booking?.guest?.name?.charAt(0) || "T"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-bold text-gray-900 dark:text-gray-100">
                            {d.booking?.guest?.name || "Tamu"}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {d.booking?.guest?.email}
                          </p>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-gray-200/60 dark:border-gray-700/60 flex items-center justify-between text-[11px]">
                        <span className="text-muted-foreground">
                          Pesanan #{d.bookingId.slice(-8).toUpperCase()}
                        </span>
                        <span className="font-semibold text-rose-600 truncate max-w-[200px]">
                          {d.booking?.property?.title}
                        </span>
                      </div>
                    </div>

                    {/* Kategori & Deskripsi Keluhan */}
                    <div className="p-3 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 space-y-1.5 text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-amber-900 dark:text-amber-200">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                        <span>{d.reasonCategory}</span>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-[11px] whitespace-pre-wrap">
                        {d.description}
                      </p>
                    </div>
                  </div>

                  {/* Bukti Foto & Status Keputusan */}
                  <div className="space-y-2 flex flex-col justify-between">
                    <div>
                      <p className="text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1.5">
                        Bukti Foto Kejadian ({d.evidenceUrls?.length || 0}):
                      </p>
                      {d.evidenceUrls && d.evidenceUrls.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {d.evidenceUrls.map((url: string, idx: number) => (
                            <div
                              key={idx}
                              onClick={() => setPreviewEvidenceUrl(url)}
                              className="w-16 h-16 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 cursor-pointer hover:border-purple-500 group relative"
                            >
                              <img
                                src={url}
                                alt={`Bukti ${idx + 1}`}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                <ZoomIn className="w-3.5 h-3.5" />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">
                          Tidak ada lampiran foto.
                        </p>
                      )}
                    </div>

                    {/* Keputusan Admin jika sudah selesai */}
                    {d.status !== "OPEN" && (
                      <div className="p-3 rounded-2xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900 text-xs space-y-1">
                        <div className="flex items-center justify-between text-purple-900 dark:text-purple-200 font-bold">
                          <span>Keputusan Admin:</span>
                          <span className="text-[10px] text-muted-foreground">
                            {d.resolvedAt
                              ? new Date(d.resolvedAt).toLocaleDateString(
                                  "id-ID"
                                )
                              : "-"}
                          </span>
                        </div>
                        {d.adminNotes && (
                          <p className="text-[11px] text-purple-800 dark:text-purple-300 italic">
                            &ldquo;{d.adminNotes}&rdquo;
                          </p>
                        )}
                        {d.status === "RESOLVED_PARTIAL_REFUND" && (
                          <div className="pt-1 flex justify-between text-[11px] font-semibold text-purple-950 dark:text-purple-100">
                            <span>
                              Refund Tamu:{" "}
                              {formatPrice(
                                d.refundApprovedIdr || 0,
                                currentCurrency
                              )}
                            </span>
                            <span>
                              Payout Host:{" "}
                              {formatPrice(
                                d.payoutApprovedIdr || 0,
                                currentCurrency
                              )}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Tombol Aksi jika OPEN */}
                    {d.status === "OPEN" && (
                      <div className="pt-2 flex justify-end">
                        <Button
                          onClick={() => setSelectedDispute(d)}
                          className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                        >
                          <Scale className="w-3.5 h-3.5 mr-1.5" />
                          Putuskan Solusi Sengketa
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Dialog Resolusi Sengketa */}
      <DisputeResolutionDialog
        dispute={selectedDispute}
        onClose={() => setSelectedDispute(null)}
        onResolve={handleResolveDispute}
        loading={loadingAction === `dispute-${selectedDispute?.id}`}
        currentCurrency={currentCurrency}
        currentLang={currentLang}
      />

      {/* Dialog Preview Foto Bukti Sengketa */}
      <Dialog
        open={!!previewEvidenceUrl}
        onOpenChange={(open) => !open && setPreviewEvidenceUrl(null)}
      >
        <DialogContent className="max-w-3xl p-4 rounded-3xl">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-sm font-bold">
              Bukti Foto Sengketa
            </DialogTitle>
          </DialogHeader>
          {previewEvidenceUrl && (
            <div className="max-h-[75vh] overflow-hidden rounded-2xl flex items-center justify-center bg-black/5 dark:bg-black/40">
              <img
                src={previewEvidenceUrl}
                alt="Foto Bukti"
                className="max-h-[70vh] w-auto object-contain rounded-xl"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
