import React, { useState } from "react"
import { Lock, Loader2 } from "lucide-react"
import { getWibDateString } from "@/lib/date-standards"
import type { Dictionary } from "@/lib/dictionary"
import type { BlockedDateItem } from "@/types"
import { toast } from "@/components/ui/use-toast"

export interface BlockDateDialogProps {
  properties: Array<{ id: string; title: string }>
  selectedPropertyId: string
  onPropertySelect: (id: string) => void
  onBlockedDateCreated: (newBlockedDate: BlockedDateItem) => void
  currentLang?: string
  t: Partial<Dictionary>
}

export default function BlockDateDialog({
  properties,
  selectedPropertyId,
  onPropertySelect,
  onBlockedDateCreated,
  currentLang = "id",
  t,
}: BlockDateDialogProps) {
  const [blockStartDate, setBlockStartDate] = useState("")
  const [blockEndDate, setBlockEndDate] = useState("")
  const [blockReason, setBlockReason] = useState("")
  const [blockingLoading, setBlockingLoading] = useState(false)

  const todayWib = getWibDateString(new Date())
  const isStartInPast = Boolean(blockStartDate && blockStartDate < todayWib)
  const isEndBeforeStart = Boolean(blockStartDate && blockEndDate && blockEndDate <= blockStartDate)

  const handleCreateBlockedDate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPropertyId || !blockStartDate || !blockEndDate) {
      toast({
        variant: "warning",
        title: currentLang === "en" ? "Incomplete Selection" : "Data Tidak Lengkap",
        description:
          t.selectPropertyAndDatesAlert ||
          (currentLang === "en"
            ? "Please select a property, start date, and end date."
            : "Harap pilih properti serta tanggal mulai dan tanggal selesai."),
      })
      return
    }

    if (isStartInPast) {
      toast({
        variant: "destructive",
        title: currentLang === "en" ? "Invalid Start Date" : "Tanggal Mulai Tidak Valid",
        description:
          currentLang === "en"
            ? "Start date cannot be in the past."
            : "Tanggal mulai blokir tidak boleh berada di masa lalu.",
      })
      return
    }

    if (isEndBeforeStart) {
      toast({
        variant: "destructive",
        title: currentLang === "en" ? "Invalid End Date" : "Tanggal Selesai Tidak Valid",
        description:
          currentLang === "en"
            ? "End date must be strictly after the start date."
            : "Tanggal selesai blokir harus setelah tanggal mulai.",
      })
      return
    }

    setBlockingLoading(true)
    try {
      const res = await fetch("/api/properties/blocked-dates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: selectedPropertyId,
          startDate: blockStartDate,
          endDate: blockEndDate,
          reason: blockReason,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(
          data.error ||
            (currentLang === "en" ? "Failed to block dates" : "Gagal memblokir tanggal")
        )
      }

      const propTitle =
        properties.find((p) => p.id === selectedPropertyId)?.title || "Properti"
      const createdItem: BlockedDateItem = {
        ...data,
        property: { id: selectedPropertyId, title: propTitle },
      }

      onBlockedDateCreated(createdItem)

      setBlockStartDate("")
      setBlockEndDate("")
      setBlockReason("")
      toast({
        variant: "success",
        title: currentLang === "en" ? "Dates Blocked" : "Tanggal Diblokir",
        description:
          t.datesBlockedSuccess ||
          (currentLang === "en"
            ? "Dates blocked successfully! Guests cannot book during this period."
            : "Tanggal berhasil diblokir! Tamu tidak dapat memesan pada rentang tanggal tersebut."),
      })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Gagal memblokir tanggal"
      toast({
        variant: "destructive",
        title: currentLang === "en" ? "Failed to Block Dates" : "Gagal Memblokir",
        description: message,
      })
    } finally {
      setBlockingLoading(false)
    }
  }

  return (
    <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 shadow-xs space-y-4">
      <div>
        <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Lock className="w-4 h-4 text-rose-500" />
          <span>{t.blockDatesTitle}</span>
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">{t.blockDatesDesc}</p>
      </div>

      <form onSubmit={handleCreateBlockedDate} className="space-y-3.5">
        {/* Pilih Properti */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
            {t.selectProperty}
          </label>
          <select
            value={selectedPropertyId}
            disabled={blockingLoading}
            onChange={(e) => onPropertySelect(e.target.value)}
            required
            className="w-full px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-xs font-medium outline-none focus:border-rose-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </div>

        {/* Tanggal Mulai & Selesai Side by Side */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              {t.checkIn} (Mulai)
            </label>
            <input
              type="date"
              required
              disabled={blockingLoading}
              value={blockStartDate}
              min={todayWib}
              onChange={(e) => setBlockStartDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-xs outline-none focus:border-rose-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            />
            {isStartInPast && (
              <p className="text-[10px] text-rose-500 font-medium">
                {currentLang === "en" ? "Cannot be in past" : "Tanggal tidak boleh masa lalu"}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              {t.checkOut} (Selesai)
            </label>
            <input
              type="date"
              required
              disabled={blockingLoading}
              value={blockEndDate}
              min={blockStartDate || todayWib}
              onChange={(e) => setBlockEndDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-xs outline-none focus:border-rose-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            />
            {isEndBeforeStart && (
              <p className="text-[10px] text-rose-500 font-medium">
                {currentLang === "en" ? "Must be after start date" : "Harus setelah tanggal mulai"}
              </p>
            )}
          </div>
        </div>

        {/* Alasan Blokir */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
            {t.blockReason}
          </label>
          <input
            type="text"
            disabled={blockingLoading}
            placeholder={t.blockReasonPlaceholder}
            value={blockReason}
            onChange={(e) => setBlockReason(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-xs outline-none focus:border-rose-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          />
        </div>

        <div className="pt-1">
          <button
            type="submit"
            disabled={
              blockingLoading ||
              !selectedPropertyId ||
              !blockStartDate ||
              !blockEndDate ||
              isStartInPast ||
              isEndBeforeStart
            }
            className="w-full py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {blockingLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Lock className="w-3.5 h-3.5" />
            )}
            <span>{blockingLoading ? t.blockingDate : t.btnBlockDate}</span>
          </button>
        </div>
      </form>
    </div>
  )
}
