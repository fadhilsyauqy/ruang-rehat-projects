import React, { useState } from "react"
import { CalendarX, CalendarDays, Calendar, Lock, Unlock } from "lucide-react"
import BlockDateDialog from "../dialogs/BlockDateDialog"
import type { Dictionary } from "@/lib/dictionary"
import type { BlockedDateItem } from "@/types"
import { toast } from "@/components/ui/use-toast"
import { ConfirmDialog } from "@/components/ui/ConfirmDialog"

export interface AvailabilityTabProps {
  properties: Array<{ id: string; title: string }>
  blockedDatesList: BlockedDateItem[]
  onBlockedDateCreated: (newBlockedDate: BlockedDateItem) => void
  onBlockedDateRemoved: (id: string) => void
  currentLang?: string
  t: Partial<Dictionary>
}

export default function AvailabilityTab({
  properties,
  blockedDatesList,
  onBlockedDateCreated,
  onBlockedDateRemoved,
  currentLang = "id",
  t,
}: AvailabilityTabProps) {
  const [selectedPropertyId, setSelectedPropertyId] = useState(
    properties[0]?.id || ""
  )
  const [unblockingId, setUnblockingId] = useState<string | null>(null)
  const [unblockTargetId, setUnblockTargetId] = useState<string | null>(null)

  const handleRemoveBlockedDate = (id: string) => {
    setUnblockTargetId(id)
  }

  const executeUnblock = async () => {
    if (!unblockTargetId) return

    setUnblockingId(unblockTargetId)
    try {
      const res = await fetch(`/api/properties/blocked-dates?id=${unblockTargetId}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Gagal membuka blokir")

      onBlockedDateRemoved(unblockTargetId)
      toast({
        variant: "success",
        title: t.toastSuccess || (currentLang === "en" ? "Success" : "Berhasil"),
        description:
          t.unblockDateSuccess ||
          (currentLang === "en"
            ? "Dates unblocked successfully."
            : "Blokir tanggal berhasil dibuka."),
      })
      setUnblockTargetId(null)
    } catch (err: unknown) {
      const errObj = err as Error
      toast({
        variant: "destructive",
        title: t.toastError || (currentLang === "en" ? "Error" : "Terjadi Kesalahan"),
        description:
          errObj.message ||
          t.unblockDateFailed ||
          (currentLang === "en"
            ? "Failed to unblock dates"
            : "Gagal membuka blokir tanggal"),
      })
    } finally {
      setUnblockingId(null)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Form Blokir Tanggal Baru (5 Kolom) */}
      <div className="lg:col-span-5">
        <BlockDateDialog
          properties={properties}
          selectedPropertyId={selectedPropertyId}
          onPropertySelect={setSelectedPropertyId}
          onBlockedDateCreated={onBlockedDateCreated}
          currentLang={currentLang}
          t={t}
        />
      </div>

      {/* List Tanggal yang Sedang Diblokir (7 Kolom) */}
      <div className="lg:col-span-7 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <CalendarX className="w-4 h-4 text-gray-400" />
            <span>{t.activeBlockedDates}</span>
          </h4>
          <span className="text-xs text-muted-foreground font-semibold px-2.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800">
            {blockedDatesList.length} terkunci
          </span>
        </div>

        {blockedDatesList.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-gray-200 dark:border-gray-800 p-8 text-center bg-gray-50/50 dark:bg-gray-900/30">
            <CalendarDays className="w-10 h-10 text-gray-400 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">{t.noBlockedDates}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {blockedDatesList.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 shadow-xs flex flex-col justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-md inline-block">
                      {item.property?.title || "Properti"}
                    </span>
                    {item.isSystemLocked && (
                      <span className="text-[10px] font-bold text-red-700 bg-red-100 dark:bg-red-950/60 border border-red-300 dark:border-red-800 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" />
                        <span>
                          {currentLang === "en"
                            ? "System Locked (Penalty)"
                            : "Dikunci Sistem (Penalti Pembatalan)"}
                        </span>
                      </span>
                    )}
                  </div>

                  <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-1.5 pt-0.5">
                    <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span>
                      {new Date(item.startDate).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                      {" — "}
                      {new Date(item.endDate).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </p>
                  {item.reason && (
                    <p className="text-[11px] text-muted-foreground italic">
                      &quot;{item.reason}&quot;
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex justify-end">
                  {item.isSystemLocked ? (
                    <div className="flex items-center gap-1 text-[11px] text-red-500 font-semibold italic">
                      <Lock className="w-3 h-3 text-red-500" />
                      <span>
                        {currentLang === "en"
                          ? "Locked by System"
                          : "Terkunci Permanen"}
                      </span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleRemoveBlockedDate(item.id)}
                      disabled={unblockingId === item.id}
                      className="px-2.5 py-1 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 text-[11px] font-semibold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Unlock className="w-3 h-3 text-gray-400" />
                      <span>
                        {unblockingId === item.id
                          ? "Membuka..."
                          : t.unblockDate}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!unblockTargetId}
        onOpenChange={(open: boolean) => !open && setUnblockTargetId(null)}
        title={t.unblockDateTitle || (currentLang === "en" ? "Unblock Dates" : "Buka Blokir Tanggal")}
        description={
          t.unblockDateDesc ||
          t.confirmUnblock ||
          (currentLang === "en"
            ? "Are you sure you want to unblock this date range? The room will be available again for guest booking."
            : "Apakah Anda yakin ingin membuka blokir tanggal ini? Kamar akan kembali tersedia untuk disewa tamu.")
        }
        confirmLabel={t.unblockDateTitle || (currentLang === "en" ? "Unblock Dates" : "Buka Blokir")}
        cancelLabel={t.cancelAction || (currentLang === "en" ? "Cancel" : "Batal")}
        variant="warning"
        loading={!!unblockingId}
        onConfirm={executeUnblock}
      />
    </div>
  )
}
